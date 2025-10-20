import React from 'react'

const Button = ({children, onClick, variant = 'primary', type = 'button', className = '', disabled = false}) => {
    const baseStyle = 'px-4 py-2 rounded-lg font-medium transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700',
        secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-gray-300',
        text: 'text-gray-700 hover:bg-gray-50'
    };
  
    return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
export default Button;