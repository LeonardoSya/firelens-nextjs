import React from 'react'

interface RangeInputProps {
  label: string;
  minValue: number | null;
  maxValue: number | null;
  defaultMinValue: number;
  defaultMaxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

const RangeInput: React.FC<RangeInputProps> = (props: RangeInputProps) => {
  const { label, minValue, maxValue, defaultMinValue, defaultMaxValue, onMinChange, onMaxChange } =
    props
  return (
    <div className='flex flex-col gap-2 px-2 py-1'>
      <label className='font-semibold tracking-wider'>{label}</label>
      <div className='flex items-center gap-2'>
        <input
          type='number'
          className='w-20 rounded-md border border-gray-800 bg-white px-2 py-1 text-sm [appearance:textfield] focus:border-gray-800 focus:outline-none focus:ring-0 dark:border-gray-800 dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          value={minValue}
          onChange={e => onMinChange(Number(e.target.value))}
          placeholder={defaultMinValue.toString()}
        />
        <span>-</span>
        <input
          type='number'
          className='w-20 rounded-md border border-gray-800 bg-white px-2 py-1 text-sm [appearance:textfield] focus:border-gray-800 focus:outline-none focus:ring-0 dark:border-gray-800 dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          value={maxValue}
          onChange={e => onMaxChange(Number(e.target.value))}
          placeholder={defaultMaxValue.toString()}
        />
      </div>
    </div>
  )
}

export default RangeInput
