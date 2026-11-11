import type { ReactNode } from 'react';
import './AuthLayout.css';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="auth-title">
        <header className="auth-header">
          <div className="auth-logo" aria-label="Planary">P</div>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </header>
        {children}
      </section>
    </main>
  );
}
