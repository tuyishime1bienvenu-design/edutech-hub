import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const MaterialsPage: React.FC = () => {
  const { primaryRole } = useAuth();
  const [revealWifi, setRevealWifi] = useState(false);

  const { data: materials } = useQuery({
    queryKey: ['learning-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_materials')
        .select('id, title, description, url, material_type, created_at, classes (name), trainer_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Try to fetch a facility password stored as a "facility_password" notice (optional)
  const { data: facility } = useQuery({
    queryKey: ['facility-password'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notices')
        .select('id, title, content')
        .eq('notice_type', 'facility_password')
        .limit(1)
        .maybeSingle();
      return data || null;
    },
  });

  const stockRequests = useMemo(() => {
    if (!materials) return [];
    return materials.filter((m: any) => ['stock', 'request', 'supply'].includes((m.material_type || '').toLowerCase()));
  }, [materials]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Materials & Facility</h1>
          <p className="text-muted-foreground">WiFi credentials and teaching materials / stock requests</p>
        </div>
      </div>

      {facility && (
        <Card>
          <CardHeader>
            <CardTitle>Facility Info — {facility.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Only authorized staff should view this. Click reveal to show details.</p>
                <div className="flex items-center gap-2">
                  <Input type={revealWifi ? 'text' : 'password'} value={facility.content || ''} readOnly />
                  <Button onClick={() => setRevealWifi(v => !v)}>{revealWifi ? 'Hide' : 'Reveal'}</Button>
                </div>
              </div>
              <div className="flex justify-end md:justify-end">
                <div className="text-xs text-muted-foreground">Visible to authenticated staff</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Learning Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Class</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Link / Details</th>
                </tr>
              </thead>
              <tbody>
                {materials?.map((m: any) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-2 py-3">{m.title}</td>
                    <td className="px-2 py-3">{m.classes?.name || '-'}</td>
                    <td className="px-2 py-3">{m.material_type}</td>
                    <td className="px-2 py-3"><a className="text-blue-600 underline" href={m.url} target="_blank" rel="noreferrer">Open</a></td>
                  </tr>
                ))}
                {materials?.length === 0 && (
                  <tr><td colSpan={4} className="px-2 py-3 text-muted-foreground">No materials uploaded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {stockRequests.length === 0 ? (
            <div className="text-muted-foreground">No stock requests found.</div>
          ) : (
            <ul className="list-disc pl-5">
              {stockRequests.map((s: any) => (
                <li key={s.id} className="mb-2">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.description}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsPage;
