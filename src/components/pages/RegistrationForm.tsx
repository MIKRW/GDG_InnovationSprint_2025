
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/content/PageTitle';
import { useAuth } from '@/components/providers/AuthProvider';
import { upgradeAnonymousUser } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';

const formSchema = z.object({
    email: z.string().email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters long.',
    }),
});

export function RegistrationForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setServerError('');

        if (!user || !user.isAnonymous) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be signed in anonymously to create an account.',
            });
            setIsLoading(false);
            return;
        }

        const result = await upgradeAnonymousUser(user, { email: values.email, pass: values.password });

        if (result.success) {
            toast({
                title: 'Account Created!',
                description: 'You have successfully created your account.',
            });
            router.push('/settings');
        } else {
            const errorCode = result.error?.code;
            if (errorCode === 'auth/email-already-in-use') {
                setServerError('This email address is already in use by another account.');
            } else if (errorCode === 'auth/weak-password') {
                 setServerError('The password is too weak. Please choose a stronger password.');
            } else {
                setServerError('An unexpected error occurred. Please try again.');
            }
        }
        setIsLoading(false);
    }

    return (
        <div className="container mx-auto">
            <PageTitle>Create Your Account</PageTitle>
            <p className="mb-6 max-w-2xl text-muted-foreground">
                Create a permanent account to save your bird book and themes across all your devices.
                Your current anonymous data will be automatically linked.
            </p>

            <Card className="max-w-md">
                 <CardHeader>
                    {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}
                 </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Must be at least 8 characters long.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

