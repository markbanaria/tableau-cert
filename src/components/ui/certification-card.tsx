'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Certification {
  id: string;
  name: string;
  description: string;
  vendor: string;
  level?: 'Associate' | 'Professional' | 'Specialist' | 'Expert';
  duration: number;
  questionCount?: number;
  passingScore: number;
  domains?: number;
  availableQuestions: number;
  coverage: number;
  color?: string;
  icon: string;
  status: 'available' | 'coming_soon' | 'beta';
  sections?: Array<{ name: string; id: string; questionCount?: number }>;
}

interface CertificationCardProps {
  certification: Certification;
  fullWidth?: boolean;
}

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    className: 'border-[var(--passed-border)]',
    style: { backgroundColor: 'var(--passed)', color: 'white' }
  },
  coming_soon: {
    label: 'Coming Soon',
    className: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    style: {}
  },
  beta: {
    label: 'Beta',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    style: {}
  }
};

export default function CertificationCard({ certification, fullWidth = false }: CertificationCardProps) {
  const isAvailable = certification.status === 'available';
  const statusConfig = STATUS_CONFIG[certification.status] || STATUS_CONFIG.available;

  return (
    <Card className={`shadow-none relative overflow-hidden py-0 lg:h-full ${!fullWidth && isAvailable ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''} ${!isAvailable ? 'text-neutral-400' : ''}`}>
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header: Logo, Title with grow, Available badge */}
        <div className='flex flex-row'>
          <div className='flex-grow'>
            <img
              src={certification.icon}
              alt={`${certification.vendor} Logo`}
              className={`h-6 w-auto max-h-6 flex-shrink-0 ${!isAvailable ? 'filter grayscale' : ''}`}
            />
          </div>
          <Badge
            variant="outline"
            className={statusConfig.className}
            style={statusConfig.style}
          >
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-2xl mt-4 mb-2 leading-tight">{certification.name}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm leading-relaxed mb-6 ${!isAvailable ? 'text-neutral-400' : 'text-muted-foreground'}`}>
          {certification.description}
        </p>

        {/* Sections */}
        {certification.sections && certification.sections.length > 0 && (
          <div className="mb-4">
            <h4 className={`text-sm font-bold mb-2 ${!isAvailable ? 'text-neutral-400' : ''}`}>Exam Coverage ({certification.sections.length})</h4>
            <div className="space-y-1">
              {certification.sections.map((section, index) => (
                <div key={section.id} className={`text-sm ${!isAvailable ? 'text-neutral-400' : 'text-muted-foreground'}`}>
                  {index + 1}. {section.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom section - aligned to bottom */}
        <div className="mt-auto space-y-4">
          {/* Question Bank */}
          {certification.availableQuestions > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${!isAvailable ? 'text-neutral-400' : ''}`}>Practice Questions Available</span>
                <span className={`text-sm font-bold ${!isAvailable ? 'text-neutral-400' : ''}`}>{certification.availableQuestions}</span>
              </div>
            </div>
          )}

          {/* Duration and Passing Score */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
            <div>
              <div className={`text-xs ${!isAvailable ? 'text-neutral-400' : 'text-muted-foreground'}`}>Duration</div>
              <div className={`text-sm font-bold ${!isAvailable ? 'text-neutral-400' : ''}`}>{certification.duration} minutes</div>
            </div>
            <div>
              <div className={`text-xs ${!isAvailable ? 'text-neutral-400' : 'text-muted-foreground'}`}>Passing Score</div>
              <div className={`text-sm font-bold ${!isAvailable ? 'text-neutral-400' : ''}`}>{certification.passingScore}/1000</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}