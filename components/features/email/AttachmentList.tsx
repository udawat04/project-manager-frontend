import * as React from 'react';
import { Paperclip, Download } from 'lucide-react';

interface AttachmentListProps {
  attachments: any[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <Paperclip className="w-4 h-4" />
        Attachments ({attachments.length})
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {attachments.map((file) => (
          <div key={file.id} className="flex items-center p-2 border border-border rounded-md hover:bg-muted/50 transition-colors">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 mr-3">
              <span className="text-xs font-bold uppercase">{file.filename.split('.').pop()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.filename}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <a href={file.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Download">
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
