import Link from 'next/link';
import { Container, Button } from '@/components/ui';

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-display text-6xl font-bold text-text-primary">404</h1>
      <p className="mt-4 text-lg text-text-muted">
        This page wandered off. Let's get you back.
      </p>
      <Link href="/" className="inline-block mt-8">
        <Button variant="primary">Go home</Button>
      </Link>
    </Container>
  );
}