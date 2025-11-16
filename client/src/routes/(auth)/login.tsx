import { Loader2, SunIcon as Sunburst } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsAuthenticated, useLogin } from "@/hooks/useAuth";
import { toast } from "sonner";

interface User {
  email: string;
  password: string;
}

export const Route = createFileRoute('/(auth)/login')({
  component: RouteComponent,
})

function RouteComponent() {

  const { mutateAsync, isPending } = useLogin()
  const { isAuthenticated } = useIsAuthenticated()
  const navigate = useNavigate();

  const defaultUser: User = {
    email: "",
    password: "",
  }
  const form = useForm({
    defaultValues: defaultUser,
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync({
          email: value.email,
          password: value.password,
        });
        navigate({ to: "/channels/@dev" })
      } catch (err) {
        console.error('Login failed:', err);
        toast.error("Invalid email or password");
      } finally {
      }
    },
  });

  if (isAuthenticated) navigate({ to: '/channels/@dev' })

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-5xl overflow-hidden flex flex-col md:flex-row shadow-lg border-border">

        <div className="md:w-1/2 bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-center relative">
          <CardHeader className="p-0 space-y-4">
            <CardTitle className="text-3xl font-semibold leading-tight">
              vyenet
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Discord for developers
            </CardDescription>
          </CardHeader>
        </div>

        <div className="md:w-1/2 bg-card text-card-foreground p-8 md:p-12 flex flex-col justify-center">
          <div className="flex flex-col mb-8">
            <div className="mb-4 text-primary">
              <Sunburst className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-semibold mb-2 tracking-tight">
              Get Started
            </h2>
            <p className="text-muted-foreground">
              Welcome to vyenet — Let's build something great.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <form.Field
              name="email"
              children={(field) => (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hi@vyenet.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />

            <Button type="submit" disabled={isPending} className={`w-full mt-4 cursor-pointer`}>
              {
                isPending ?
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" />
                    <span>Loggin you in...</span>
                  </div>
                  :
                  <span>Login</span>
              }
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-2">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary underline underline-offset-4"
              >
                Create One
              </Link>
            </p>
          </form>
        </div>
      </Card>
    </div>
  );
}
