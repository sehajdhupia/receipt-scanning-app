import { useState } from 'react';

interface UploadFormProps {
  onUpload: (file: File) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUpload }) => {
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name);
      setFilePreview(URL.createObjectURL(file));
      onUpload(file);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {filePreview && (
        <img src={filePreview} alt="Receipt Preview" className="w-64 border rounded shadow-md" />
      )}
    </div>
  );
};

export default UploadForm;
