
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SignatureCaptureProps {
  onSignatureChange: (signature: string) => void;
}

export interface SignatureCaptureRef {
  clear: () => void;
  isEmpty: () => boolean;
  getSignature: () => string;
}

const SignatureCapture = forwardRef<SignatureCaptureRef, SignatureCaptureProps>(
  ({ onSignatureChange }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [, setForceUpdate] = useState(0);
    
    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvas.current?.clear();
        onSignatureChange('');
      },
      isEmpty: () => {
        return sigCanvas.current?.isEmpty() || false;
      },
      getSignature: () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
          return '';
        }
        
        // Get the canvas and convert to black only
        const canvas = sigCanvas.current.getCanvas();
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        
        if (!ctx) return sigCanvas.current.toDataURL();
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw original signature
        ctx.drawImage(canvas, 0, 0);
        
        // Get image data and convert all non-white to pure black
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // If pixel is not white, make it pure black
          if (r < 250 || g < 250 || b < 250) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return tempCanvas.toDataURL('image/png');
      }
    }));

    const handleEnd = () => {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        // Force update to trigger getSignature with new processing
        setForceUpdate(prev => prev + 1);
        
        const canvas = sigCanvas.current.getCanvas();
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        
        if (!ctx) return;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw original signature
        ctx.drawImage(canvas, 0, 0);
        
        // Get image data and convert all non-white to pure black
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // If pixel is not white, make it pure black
          if (r < 250 || g < 250 || b < 250) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const signature = tempCanvas.toDataURL('image/png');
        onSignatureChange(signature);
      }
    };

    const clearSignature = () => {
      sigCanvas.current?.clear();
      onSignatureChange('');
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Firma Digital del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 200,
                className: 'signature-canvas w-full'
              }}
              onEnd={handleEnd}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={clearSignature} variant="outline" size="sm">
              Limpiar Firma
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Por favor firme en el área de arriba usando su mouse o pantalla táctil
          </p>
        </CardContent>
      </Card>
    );
  }
);

SignatureCapture.displayName = 'SignatureCapture';

export default SignatureCapture;
