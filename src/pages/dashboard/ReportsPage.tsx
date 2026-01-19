import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Calendar, X as XIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState('30');
  const { primaryRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [reportClassId, setReportClassId] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0,10));
  const [presentCount, setPresentCount] = useState<number | ''>('');
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const { toast } = useToast();
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    if (primaryRole === 'trainer') setOnlyMine(true);
  }, [primaryRole]);

  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports-table', onlyMine, user?.id],
    queryFn: async () => {
      let q = supabase
        .from('class_reports')
        .select('id, date, topics_covered, notes, class_id, classes (name), trainer_id')
        .order('date', { ascending: false })
        .limit(200);
      if (onlyMine && user?.id) q = q.eq('trainer_id', user.id);
      const { data: reportsData, error } = await q;
      if (error) throw error;

      const trainerIds = Array.from(new Set((reportsData || []).map((r: any) => r.trainer_id).filter(Boolean)));
      let profilesMap: Record<string, string> = {};
      if (trainerIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', trainerIds as any[]);
        if (pErr) throw pErr;
        (profiles || []).forEach((p: any) => {
          const name = p.full_name || p.email || p.user_id;
          profilesMap[p.user_id] = name;
        });
      }

      return (reportsData || []).map((r: any) => ({
        ...r,
        trainer_name: r.trainer_id ? (profilesMap[r.trainer_id] || r.trainer_id) : '-',
      }));
    },
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => setPage(1), [onlyMine, pageSize]);
  const totalPages = Math.max(1, Math.ceil((reports?.length || 0) / pageSize));
  const currentPageReports = useMemo(() => {
    if (!reports) return [];
    const start = (page - 1) * pageSize;
    return reports.slice(start, start + pageSize);
  }, [reports, page, pageSize]);

  // Fetch trainer's classes from the classes table where trainer_id matches
  const { data: trainerClasses } = useQuery({
    queryKey: ['trainer-classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('trainer_id', user.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && primaryRole === 'trainer',
  });

  const createReportMutation = useMutation({
    mutationFn: async () => {
      if (primaryRole !== 'trainer') throw new Error('Only trainers can create class reports');
      if (!reportClassId) throw new Error('Select a class');
      if (topics.length === 0) throw new Error('Add at least one topic');
      if (presentCount === '' || presentCount === null) throw new Error('Enter present student count');
      const notes = `Present: ${presentCount}`;

      const { error } = await supabase.from('class_reports').insert({
        class_id: reportClassId,
        date: reportDate,
        topics_covered: topics.join('\n'),
        notes,
        trainer_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-table'] });
      setReportClassId('');
      setTopics([]);
      setNewTopic('');
      setPresentCount('');
      setReportDate(new Date().toISOString().slice(0,10));
      toast({ title: 'Report created' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to create report', variant: 'destructive' });
    }
  });

  if (isLoadingReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {primaryRole === 'trainer' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Class Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Select value={reportClassId} onValueChange={(v) => setReportClassId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainerClasses?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
              </div>
              <div>
                <Input type="number" placeholder="Present count" value={presentCount as any} onChange={(e) => setPresentCount(e.target.value === '' ? '' : parseInt(e.target.value))} />
              </div>
              <div>
                <Button onClick={() => createReportMutation.mutate()} disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? 'Saving...' : 'Save Report'}
                </Button>
              </div>
              <div className="md:col-span-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <Input placeholder="Add topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
                  <div className="col-span-1 md:col-span-2 flex gap-2">
                    <Button onClick={() => {
                      const t = newTopic.trim();
                      if (!t) return;
                      setTopics(prev => [...prev, t]);
                      setNewTopic('');
                    }}>Add Topic</Button>
                    <Button variant="outline" onClick={() => { setTopics([]); setNewTopic(''); }}>Clear</Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {topics.map((t, idx) => (
                    <Badge key={idx} className="flex items-center gap-2">
                      <span>{t}</span>
                      <button onClick={() => setTopics(prev => prev.filter((_, i) => i !== idx))} className="opacity-60 hover:opacity-100">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground">Recorded class reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {primaryRole === 'trainer' && (
            <label className="ml-4 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
              <span>Show only my reports</span>
            </label>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Class</th>
                  <th className="px-2 py-2">Trainer</th>
                  <th className="px-2 py-2">Topics</th>
                  <th className="px-2 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {currentPageReports?.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-3">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-2 py-3">{r.classes?.name || r.class_id}</td>
                    <td className="px-2 py-3">{r.trainer_name || r.trainer_id || '-'}</td>
                    <td className="px-2 py-3 whitespace-pre-wrap">{r.topics_covered}</td>
                    <td className="px-2 py-3">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Page {page} of {totalPages} — {reports?.length || 0} reports</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
          <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} className="ml-2 p-1 border rounded">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;