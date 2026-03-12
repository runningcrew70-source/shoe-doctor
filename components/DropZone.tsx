'use client';

import { useRef, DragEvent, ChangeEvent } from 'react';

interface DropZoneProps {
    label: string;
    icon: string;
    description: string;
    image: string | null;
    onImageChange: (base64: string | null) => void;
    disabled?: boolean;
}

export default function DropZone({ label, icon, description, image, onImageChange, disabled }: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const readFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => onImageChange(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) readFile(file);
    };

    const handleClick = () => {
        if (!image && !disabled) inputRef.current?.click();
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageChange(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div
            className={`upload-zone ${image ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <div className="upload-content">
                {!image && (
                    <>
                        <div className="upload-icon-large">{icon}</div>
                        <h3>{label}</h3>
                        <p className="upload-subtext" dangerouslySetInnerHTML={{ __html: description }} />
                    </>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                />
                {image && (
                    <div className="preview-container">
                        <img src={image} alt={label} />
                        <button className="remove-btn" onClick={handleRemove}>×</button>
                    </div>
                )}
            </div>
        </div>
    );
}
