'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            {variant === 'destructive' ? (
              <div className="p-1.5 rounded-full bg-error-soft text-error shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
            ) : variant === 'warning' ? (
              <div className="p-1.5 rounded-full bg-warning-soft text-warning-deep shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
            ) : null}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-xs text-body leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-8 text-xs rounded-[6px] border-hairline font-medium"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
            className={cn(
              'h-8 text-xs rounded-[6px] font-semibold',
              variant === 'warning' && 'bg-amber-600 hover:bg-amber-700 text-white border-transparent'
            )}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
