import { useState } from 'react';
import { DocumentLetterhead } from '@/components/ui/DocumentLetterhead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';

const DocumentsPage = () => {
  const [docType, setDocType] = useState('towhom');
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientTitle: '',
    subject: '',
    body: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handlePrint = () => {
    window.print();
  };

  const getTemplateBody = (type: string) => {
    switch (type) {
      case 'towhom':
        return `TO WHOM IT MAY CONCERN

This is to certify that [Name] is/was an employee of our organization...

Any assistance rendered to them would be highly appreciated.`;
      case 'contract':
        return `EMPLOYMENT CONTRACT

This agreement is made between [Organization Name] and [Name]...

1. Position: ...
2. Salary: ...
3. Start Date: ...`;
      default:
        return '';
    }
  };

  const handleTypeChange = (val: string) => {
    setDocType(val);
    if (!formData.body) {
        setFormData(prev => ({...prev, body: getTemplateBody(val)}));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Document Generator</h1>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Print Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls - Hidden when printing */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={docType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="towhom">To Whom It May Concern</SelectItem>
                    <SelectItem value="contract">Employment Contract</SelectItem>
                    <SelectItem value="generic">Generic Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Name</Label>
                <Input 
                  value={formData.recipientName}
                  onChange={e => setFormData({...formData, recipientName: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>

               <div className="space-y-2">
                <Label>Recipient Title/Address (Optional)</Label>
                <Textarea 
                  value={formData.recipientTitle}
                  onChange={e => setFormData({...formData, recipientTitle: e.target.value})}
                  placeholder="e.g. Human Resources Manager&#10;Company Name&#10;Kigali, Rwanda"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject (Optional)</Label>
                <Input 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g. RECOMMENDATION LETTER"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea 
                  className="min-h-[300px] font-mono text-sm"
                  value={formData.body}
                  onChange={e => setFormData({...formData, body: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <div className="border shadow-sm print:border-none print:shadow-none">
            <DocumentLetterhead>
              <div className="space-y-6 text-base leading-relaxed max-w-3xl mx-auto">
                <div className="flex justify-end">
                    <p>{new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="space-y-1">
                    {formData.recipientTitle ? (
                        <div className="whitespace-pre-wrap">{formData.recipientTitle}</div>
                    ) : (
                        <p className="font-bold">TO: {formData.recipientName || '[Recipient Name]'}</p>
                    )}
                </div>

                {formData.subject && (
                    <div className="font-bold underline uppercase text-center my-8">
                        {formData.subject}
                    </div>
                )}

                <div className="whitespace-pre-wrap min-h-[400px]">
                    {formData.body || 'Start typing to see content here...'}
                </div>

                <div className="mt-12 pt-8">
                    <p>Sincerely,</p>
                    <div className="h-16"></div>
                    <p className="border-t border-black inline-block min-w-[200px] pt-2">
                        Authorized Signature
                    </p>
                </div>
              </div>
            </DocumentLetterhead>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;