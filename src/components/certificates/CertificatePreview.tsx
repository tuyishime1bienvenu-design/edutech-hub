import { Award } from 'lucide-react';

interface CertificateTemplate {
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

interface CertificatePreviewProps {
  template: CertificateTemplate;
  studentName: string;
  programName: string;
  startDate: string;
  endDate: string;
  registrationNumber?: string;
}

const CertificatePreview = ({
  template,
  studentName,
  programName,
  startDate,
  endDate,
  registrationNumber,
}: CertificatePreviewProps) => {
  const getBorderStyle = () => {
    switch (template.border_style) {
      case 'classic':
        return 'border-8 border-double';
      case 'modern':
        return 'border-4 border-solid';
      case 'elegant':
        return 'border-[12px] border-solid shadow-inner';
      case 'simple':
        return 'border-2 border-solid';
      default:
        return 'border-4';
    }
  };

  const getFontFamily = () => {
    switch (template.font_family) {
      case 'serif':
        return 'font-serif';
      case 'sans-serif':
        return 'font-sans';
      case 'cursive':
        return 'font-serif italic';
      default:
        return 'font-serif';
    }
  };

  return (
    <div
      className={`relative p-8 md:p-12 aspect-[1.414/1] ${getBorderStyle()} ${getFontFamily()}`}
      style={{
        backgroundColor: template.background_color,
        color: template.text_color,
        borderColor: template.text_color,
      }}
    >
      {/* Corner decorations for classic/elegant */}
      {(template.border_style === 'classic' || template.border_style === 'elegant') && (
        <>
          <div
            className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2"
            style={{ borderColor: template.text_color }}
          />
          <div
            className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2"
            style={{ borderColor: template.text_color }}
          />
          <div
            className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2"
            style={{ borderColor: template.text_color }}
          />
          <div
            className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2"
            style={{ borderColor: template.text_color }}
          />
        </>
      )}

      <div className="flex flex-col items-center justify-between h-full text-center">
        {/* Header with Logo */}
        <div className="space-y-2">
          {template.logo_url ? (
            <img
              src={template.logo_url}
              alt="Organization Logo"
              className="h-16 md:h-20 mx-auto object-contain"
            />
          ) : (
            <Award className="w-16 h-16 mx-auto" style={{ color: template.text_color }} />
          )}
          <h1 className="text-2xl md:text-4xl font-bold tracking-wider uppercase">
            Certificate of Completion
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-4 max-w-2xl">
          <p className="text-base md:text-lg">{template.message}</p>
          <h2
            className="text-2xl md:text-4xl font-bold py-2 border-b-2"
            style={{ borderColor: template.text_color }}
          >
            {studentName}
          </h2>
          <p className="text-base md:text-lg">
            has successfully completed the program
          </p>
          <h3 className="text-xl md:text-2xl font-semibold">{programName}</h3>
          
          {template.include_dates && (
            <p className="text-sm md:text-base">
              From <strong>{startDate}</strong> to <strong>{endDate}</strong>
            </p>
          )}
          
          {template.additional_text && (
            <p className="text-sm md:text-base italic mt-4">{template.additional_text}</p>
          )}
        </div>

        {/* Footer */}
        <div className="w-full flex justify-between items-end">
          <div className="text-left">
            {template.include_registration_number && registrationNumber && (
              <p className="text-xs md:text-sm">
                Reg. No: <strong>{registrationNumber}</strong>
              </p>
            )}
          </div>
          <div className="text-center">
            <div
              className="w-32 md:w-48 border-t-2 pt-2"
              style={{ borderColor: template.text_color }}
            >
              <p className="text-xs md:text-sm">Authorized Signature</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-sm">Date Issued</p>
            <p className="text-xs md:text-sm font-semibold">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
