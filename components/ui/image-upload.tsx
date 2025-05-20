import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageUploaded: (imageId: string, imageUrl: string) => void;
  className?: string;
  currentImageUrl?: string;
  maxSizeMB?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  label?: string;
}

export function ImageUpload({
  onImageUploaded,
  className,
  currentImageUrl,
  maxSizeMB = 5,
  width = 300, 
  height = 300,
  aspectRatio,
  label = "Upload Image"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset error state
    setError(null);
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds the maximum allowed size (${maxSizeMB}MB)`);
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    
    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Start upload
    setIsUploading(true);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        // Upload to server
        const response = await fetch('/api/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: base64data,
            mimeType: file.type,
            filename: file.name,
            size: file.size,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }
        
        const data = await response.json();
        
        // Call callback with the image ID
        onImageUploaded(data.id, `/api/images/${data.id}`);
        
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setIsUploading(false);
      // Reset preview
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(currentImageUrl || null);
    }
  };
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <div 
        className={cn(
          "relative border rounded-md overflow-hidden cursor-pointer",
          "flex flex-col items-center justify-center bg-muted/30",
          "hover:bg-muted/50 transition-colors",
          error ? "border-destructive" : "border-border"
        )}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined 
        }}
        onClick={handleClick}
      >
        {previewUrl ? (
          <>
            <Image 
              src={previewUrl} 
              alt="Image preview" 
              fill
              className="object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </>
        ) : (
          <>
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : (
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            )}
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
      
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={handleClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {previewUrl ? "Change Image" : "Select Image"}
          </>
        )}
      </Button>
    </div>
  );
} 