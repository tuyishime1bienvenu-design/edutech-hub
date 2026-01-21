import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, phone, roles = ["student"], studentData } = await req.json();

    console.log(`Creating user with email: ${email}, roles: ${roles}`);

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ success: false, message: "Email, password, and fullName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate roles
    const validRoles = ["admin", "secretary", "trainer", "finance", "student", "it"];
    if (!Array.isArray(roles) || roles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Roles must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const role of roles) {
      if (!validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ success: false, message: `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate student data if role includes student
    if (roles.includes("student") && !studentData) {
      return new Response(
        JSON.stringify({ success: false, message: "Student data is required for student registration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);

    if (userExists) {
      console.log(`User ${email} already exists`);
      return new Response(
        JSON.stringify({ success: false, message: "User already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw authError;
    }

    const userId = authData.user.id;
    console.log(`Created auth user with ID: ${userId}`);

    // Create profile (update if exists from trigger)
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      user_id: userId,
      email,
      full_name: fullName,
      phone: phone || null,
    }, {
      onConflict: 'user_id'
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't throw - profile might already exist from trigger
    } else {
      console.log("Profile created/updated successfully");
    }

    // Create roles
    const roleInserts = roles.map(role => ({
      user_id: userId,
      role: role,  // Store as individual role records, not text
    }));

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert(roleInserts);

    if (roleError) {
      console.error("Role creation error:", roleError);
      throw roleError;
    } else {
      console.log(`Roles '${roles.join(", ")}' assigned successfully`);
    }

    // If role includes student, create student record
    if (roles.includes("student") && studentData) {
      const { error: studentError } = await supabaseAdmin.from("students").insert({
        user_id: userId,
        registration_number: studentData.registrationNumber,
        school_name: studentData.schoolName,
        level: studentData.level,
        preferred_shift: studentData.preferredShift,
        class_id: studentData.classId || null,
        has_whatsapp: studentData.hasWhatsapp || false,
        alternative_whatsapp: studentData.alternativeWhatsapp || null,
        generated_password: password,
      });

      if (studentError) {
        console.error("Student creation error:", studentError);
        throw studentError;
      } else {
        console.log("Student record created successfully");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User created successfully with roles: ${roles.join(", ")}`,
        userId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
