import { useState } from 'react';
import type { TransactionRecord } from '@paypal-intent/shared';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { TransactionStatusBadge } from '../ui/TransactionStatusBadge';
import { formatCurrency } from '../../lib/utils';
import { History, Receipt, Copy, Printer } from 'lucide-react';

export function HistoryScreen() {
  const { transactions, startIntent, navigateTo } = useApp();
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  const handleCloneIntent = (prompt: string) => {
    startIntent(prompt, 350);
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<History className="w-6 h-6" />}
        title="No Past Transactions Yet"
        description="Transactions authorized via PayPal Sandbox will appear here with permanent immutable receipts."
        actionText="Create an Intent"
        onAction={() => navigateTo('home')}
        className="my-12"
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between text-left">
        <div>
          <Badge variant="info">Activity Ledger</Badge>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Transaction History & Receipts</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">{transactions.length} Records</span>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <Card key={tx.id} className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <TransactionStatusBadge status={tx.status} />
                  <span className="text-xs font-mono text-slate-400">{tx.id}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 truncate">{tx.intentSummary}</h4>
                <p className="text-xs text-slate-400">
                  {new Date(tx.createdAt).toLocaleDateString()} • Hash: {tx.transactionHash.slice(0, 16)}...
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-900 block">
                    {formatCurrency(tx.grossAmount, tx.currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Net: {formatCurrency(tx.netAmount)}</span>
                </div>

                <Button size="sm" variant="outline" onClick={() => setSelectedTx(tx)}>
                  <Receipt className="w-3.5 h-3.5 mr-1.5" />
                  <span>Receipt</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Digital Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title="PayPal Intent Digital Receipt"
        description="Immutable audit snapshot with verified PayPal Sandbox settlement details."
      >
        {selectedTx && (
          <div className="space-y-4 text-left text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-emerald-700">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Execution Date:</span>
                <span>{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 block">Original Purchasing Goal:</span>
              <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 italic text-slate-800">
                "{selectedTx.intentSummary}"
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700 block">Settlement Breakdown:</span>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Gross Charged:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedTx.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PayPal Merchant Fee:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedTx.feeAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Net Disbursed:</span>
                  <span className="font-mono">{formatCurrency(selectedTx.netAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">SHA-256 Snapshot Hash</span>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified Snapshot Digest</span>
              </div>
              <div className="p-2 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-lg break-all">
                {selectedTx.transactionHash}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    handleCloneIntent(selectedTx.intentSummary);
                    setSelectedTx(null);
                  }}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  Clone Intent
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedTx(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
