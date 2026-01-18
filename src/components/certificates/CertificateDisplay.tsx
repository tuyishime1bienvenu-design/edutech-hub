import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CertificateTemplate {
  id: string;
  name: string;
  logo_url: string | null;
  message: string;
  background_color: string;
  text_color: string;
  border_style: string;
  font_family: string;
  include_dates: boolean;
  include_registration_number: boolean;
  additional_text: string | null;
}

interface Student {
  id: string;
  registration_number: string;
  profile: {
    full_name: string;
    email: string;
  } | null;
  classes: {
    name: string;
    programs?: {
      name: string;
      start_date: string;
      end_date: string;
    } | null;
  } | null;
}

interface CertificateDisplayProps {
  student: Student;
  template: CertificateTemplate;
}

const CertificateDisplay = ({ student, template }: CertificateDisplayProps) => {
  // Get issued certificate details
  const { data: issuedCertificate } = useQuery({
    queryKey: ['issued-certificate', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issued_certificates')
        .select('*')
        .eq('student_id', student.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const studentName = student.profile?.full_name || 'Student Name';
  const programName = student.classes?.programs?.name || student.classes?.name || 'Program';
  const startDate = student.classes?.programs?.start_date
    ? format(new Date(student.classes.programs.start_date), 'MMMM d, yyyy')
    : 'Program Start';
  const endDate = student.classes?.programs?.end_date
    ? format(new Date(student.classes.programs.end_date), 'MMMM d, yyyy')
    : 'Program End';
  const issueDate = issuedCertificate?.issued_date
    ? format(new Date(issuedCertificate.issued_date), 'MMMM d, yyyy')
    : format(new Date(), 'MMMM d, yyyy');

  // Use company logo from public folder
  const logoUrl = '/logo.jpg';

  return (
    <div className="flex justify-center items-center p-4 bg-blue-50 min-h-[600px]">
      <div
        className="relative w-full max-w-4xl aspect-[1.414/1] bg-gradient-to-br from-amber-50 to-amber-100"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)',
        }}
      >
        {/* Outer Golden Border */}
        <div className="absolute inset-0 border-8 border-amber-600"></div>
        
        {/* Inner Golden Border */}
        <div className="absolute inset-2 border-2 border-amber-600"></div>

        {/* Corner Flourishes */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600 rounded-tr-lg"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600 rounded-bl-lg"></div>
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600 rounded-br-lg"></div>

        {/* Content */}
        <div className="relative h-full p-12 flex flex-col items-center justify-between text-center">
          {/* Header */}
          <div className="space-y-4 w-full">
            <h1 className="text-5xl md:text-6xl font-bold text-blue-900 tracking-wide">
              GRADUATION
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold text-amber-600 tracking-widest">
              CERTIFICATE
            </h2>
            
            {/* Decorative Swirl */}
            <div className="flex justify-center my-4">
              <div className="w-16 h-16 border-2 border-amber-600 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-600 rounded-full"></div>
              </div>
            </div>

            <p className="text-lg text-gray-700 mt-6">{template.message || 'This is to certify that'}</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center space-y-6 w-full max-w-3xl">
            {/* Student Name */}
            <div className="py-4">
              <h3 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2" style={{ fontFamily: 'serif' }}>
                {studentName}
              </h3>
              <div className="w-64 h-0.5 bg-amber-600 mx-auto"></div>
            </div>

            {/* Program Text */}
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed px-8">
              has successfully completed the requirements for{' '}
              <strong className="text-blue-900">{programName}</strong> and is hereby awarded this certificate
              in recognition of their achievement.
            </p>

            {/* Dates */}
            {template.include_dates && (
              <p className="text-base text-gray-700 mt-4">
                From <strong>{startDate}</strong> to <strong>{endDate}</strong>
              </p>
            )}

            {/* Additional Text */}
            {template.additional_text && (
              <p className="text-base italic text-gray-600 mt-4">{template.additional_text}</p>
            )}
          </div>

          {/* Footer with Signatures and Logo */}
          <div className="w-full flex justify-between items-end mt-8">
            {/* Left Signature */}
            <div className="flex-1 text-center">
              <div className="w-48 h-0.5 bg-amber-600 mx-auto mb-2"></div>
              <p className="text-sm font-bold text-blue-900 uppercase">DR. EMILY ROBERTS</p>
              <p className="text-xs text-gray-700">Dean, Faculty of Arts & Design</p>
              <p className="text-xs text-gray-700">Brightway University</p>
            </div>

            {/* Center Logo/Seal */}
            <div className="flex-shrink-0 mx-8">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-amber-600 bg-white flex items-center justify-center shadow-lg">
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    // Fallback if logo not found
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `
                        <div class="text-center">
                          <p class="text-xs font-bold text-blue-900 mb-1">TOP UNIVERSITY</p>
                          <p class="text-2xl font-bold text-blue-900">AWARD</p>
                          <p class="text-xs font-bold text-blue-900 mt-1">2026 GRADUATES</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Signature */}
            <div className="flex-1 text-center">
              <div className="w-48 h-0.5 bg-amber-600 mx-auto mb-2"></div>
              <p className="text-sm font-bold text-blue-900 uppercase">DR. ANDREW KRAMER</p>
              <p className="text-xs text-gray-700">President</p>
              <p className="text-xs text-gray-700">Brightway University</p>
            </div>
          </div>

          {/* Issuance Date */}
          <div className="w-full text-center mt-6">
            <p className="text-sm text-gray-700">
              Issued on this {format(new Date(issueDate), 'do')} day of {format(new Date(issueDate), 'MMMM, yyyy')}
            </p>
            {template.include_registration_number && (
              <p className="text-xs text-gray-600 mt-2">
                Registration Number: <strong>{student.registration_number}</strong>
              </p>
            )}
            {issuedCertificate?.certificate_number && (
              <p className="text-xs text-gray-600 mt-1">
                Certificate Number: <strong>{issuedCertificate.certificate_number}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDisplay;
