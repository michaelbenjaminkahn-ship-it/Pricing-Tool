import { useId } from 'react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}: CheckboxProps) {
  const id = useId();

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="
          w-4 h-4 text-blue-600 border-gray-300 rounded
          focus:ring-2 focus:ring-blue-500
          disabled:opacity-50
        "
      />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}
