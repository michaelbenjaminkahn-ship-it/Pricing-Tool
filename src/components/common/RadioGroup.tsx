import { useId } from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  inline?: boolean;
  className?: string;
}

export function RadioGroup({
  label,
  value,
  onChange,
  options,
  inline = true,
  className = '',
}: RadioGroupProps) {
  const groupId = useId();

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className={`flex ${inline ? 'flex-row gap-4' : 'flex-col gap-2'}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name={groupId}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="
                w-4 h-4 text-blue-600 border-gray-300
                focus:ring-2 focus:ring-blue-500
              "
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
