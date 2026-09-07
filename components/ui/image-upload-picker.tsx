'use client';

import * as React from 'react';
import { Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import { UserAvatar } from './user-avatar';
import { Button } from './button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadPickerProps {
  currentImageUrl?: string | null;
  name?: string;
  onFileSelect?: (file: File | null, previewUrl: string | null) => void;
  onDirectUpload?: (file: File) => Promise<void>;
  onRemoveImage?: () => Promise<void> | void;
  isUploading?: boolean;
  size?: 'md' | 'lg' | 'xl';
  helperText?: string;
  className?: string;
}

export function ImageUploadPicker({
  currentImageUrl,
  name = 'User',
  onFileSelect,
  onDirectUpload,
  onRemoveImage,
  isUploading = false,
  size = 'lg',
  helperText = 'Upload a photo from your device (JPEG, PNG, WEBP max 5MB)',
  className,
}: ImageUploadPickerProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const displayImage = localPreview || currentImageUrl;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    if (onFileSelect) {
      onFileSelect(file, previewUrl);
    }

    if (onDirectUpload) {
      try {
        await onDirectUpload(file);
      } catch {
        setLocalPreview(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setLocalPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null, null);
    }
    if (onRemoveImage) {
      onRemoveImage();
    }
  };

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Avatar Container with Hover Overlay & Drag-Drop */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-full cursor-pointer group shrink-0 transition-transform active:scale-95',
          dragOver && 'ring-4 ring-primary/40'
        )}
        title="Click to upload profile photo"
      >
        <UserAvatar name={name} avatarUrl={displayImage} size={size} />

        {/* Hover / Loading Overlay */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white transition-opacity',
            isUploading ? 'opacity-100 cursor-wait' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Camera className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">Upload</span>
            </>
          )}
        </div>
      </div>

      {/* Controls & Helper Text */}
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 text-xs gap-1.5"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{displayImage ? 'Change Photo' : 'Upload Photo'}</span>
          </Button>

          {displayImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isUploading}
              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      </div>
    </div>
  );
}
