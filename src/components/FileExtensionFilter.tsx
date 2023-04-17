import { Button } from './Button';

interface FileExtensionFilterProps {
  selectedExtensions: string[];
  onSelectExtension: (extension: string) => void;
  extensions: string[];
  onClearExtensions: () => void;
}

export const FileExtensionFilter: React.FC<FileExtensionFilterProps> = ({
  selectedExtensions,
  onSelectExtension,
  extensions,
  onClearExtensions,
}) => {
  const handleExtensionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onSelectExtension(event.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor="file-extension" className="block mb-2">
        Filter by file type:
      </label>
      <div className="flex flex-wrap items-start">
        <div className="flex flex-wrap max-w-sm">
          {extensions.map((extension) => (
            <label key={extension} className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                className="form-checkbox"
                value={extension}
                checked={selectedExtensions.includes(extension)}
                onChange={handleExtensionChange}
                aria-label={`Filter by ${extension} file type`}
              />
              <span className="ml-2">{extension}</span>
            </label>
          ))}
        </div>
        {selectedExtensions.length ? (
          <Button variant="danger" onClick={onClearExtensions}>
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
};
