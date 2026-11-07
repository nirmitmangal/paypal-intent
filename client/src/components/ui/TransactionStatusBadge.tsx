import { Badge } from './Badge';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export interface TransactionStatusBadgeProps {
  status: string;
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  const normStatus = status.toLowerCase();

  if (normStatus === 'completed' || normStatus === 'captured' || normStatus === 'success') {
    return (
      <Badge variant="success" size="sm">
        <CheckCircle2 className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  }

  if (normStatus === 'pending' || normStatus === 'created') {
    return (
      <Badge variant="warning" size="sm">
        <Clock className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  }

  if (normStatus === 'approved') {
    return (
      <Badge variant="info" size="sm">
        <Clock className="w-3 h-3" />
        <span className="capitalize">Approved (Ready to Capture)</span>
      </Badge>
    );
  }

  if (normStatus === 'failed' || normStatus === 'cancelled') {
    return (
      <Badge variant="error" size="sm">
        <XCircle className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" size="sm">
      <AlertCircle className="w-3 h-3" />
      <span className="capitalize">{status}</span>
    </Badge>
  );
}
