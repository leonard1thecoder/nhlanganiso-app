import Image from 'next/image';

export function AuthLogo() {
  return (
    <div className="auth-logo">
      <Image
        src="/brand/logo.png"
        alt="Nhlanganiso Catering and Baking"
        width={1536}
        height={1024}
        className="auth-logo__img"
        priority
      />
    </div>
  );
}
