import { type ReactNode } from 'react';

interface AdminHeaderProps {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
}

const AdminHeader = ({ title, leftAction, rightAction }: AdminHeaderProps) => {
  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="w-20 flex justify-start">
          {leftAction ?? null}
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="w-20 flex justify-end">
          {rightAction ?? null}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
