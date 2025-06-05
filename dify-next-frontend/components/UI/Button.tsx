import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

// Styled component using emotion
const StyledButton = styled.button<{variant?: 'primary' | 'secondary' | 'outline'}>`
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.variant === 'secondary' && css`
    background-color: #f3f4f6;
    color: #374151;
    &:hover {
      background-color: #e5e7eb;
    }
  `}
  
  ${props => props.variant === 'outline' && css`
    background-color: transparent;
    color: #3b82f6;
    border: 1px solid #3b82f6;
    &:hover {
      background-color: #eff6ff;
    }
  `}
  
  ${props => (!props.variant || props.variant === 'primary') && css`
    background-color: #3b82f6;
    color: white;
    &:hover {
      background-color: #2563eb;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => (
  <StyledButton variant={variant} {...props}>{children}</StyledButton>
);

export default Button;
