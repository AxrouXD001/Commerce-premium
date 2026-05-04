import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Iniciar sesión" description="Introduce tu correo y contraseña para acceder a tu cuenta.">
            <Head title="Log in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div
                        className={cn('grid gap-2 opacity-0', 'animate-lux-fade-up')}
                        style={{ animationDelay: '40ms', animationFillMode: 'forwards' }}
                    >
                        <Label htmlFor="email" variant="form">
                            Correo electrónico
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div
                        className={cn('grid gap-2 opacity-0', 'animate-lux-fade-up')}
                        style={{ animationDelay: '110ms', animationFillMode: 'forwards' }}
                    >
                        <div className="flex items-center">
                            <Label htmlFor="password" variant="form">
                                Contraseña
                            </Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-xs" tabIndex={5}>
                                    ¿Olvidaste tu contraseña?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div
                        className={cn('flex items-center space-x-3 opacity-0', 'animate-lux-fade-up')}
                        style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}
                    >
                        <Checkbox
                            id="remember"
                            name="remember"
                            tabIndex={3}
                            checked={data.remember}
                            onCheckedChange={(v) => setData('remember', v === true)}
                        />
                        <Label htmlFor="remember" variant="default" className="text-muted-foreground cursor-pointer text-sm font-normal">
                            Recordarme en este dispositivo
                        </Label>
                    </div>

                    <div
                        className={cn('opacity-0', 'animate-lux-fade-up')}
                        style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
                    >
                        <Button type="submit" className="mt-2 w-full" tabIndex={4} disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                    </div>
                </div>

                <div
                    className={cn('text-muted-foreground text-center text-sm opacity-0', 'animate-lux-fade-up')}
                    style={{ animationDelay: '320ms', animationFillMode: 'forwards' }}
                >
                    ¿No tienes cuenta?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Crear cuenta
                    </TextLink>
                </div>
            </form>

            {status ? <div className="text-center text-sm font-medium text-emerald-400">{status}</div> : null}
        </AuthLayout>
    );
}
