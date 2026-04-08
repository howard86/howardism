import Card from "./Card";
import LoginForm, { type OnLogin } from "./LoginForm";

interface LoginPageProps {
  onLogin: OnLogin;
}

export default function LoginPage({ onLogin }: LoginPageProps): JSX.Element {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="my-6 text-center font-extrabold text-3xl">
        Sign in to your account
      </h1>
      <Card>
        <LoginForm onLogin={onLogin} />
      </Card>
    </div>
  );
}
