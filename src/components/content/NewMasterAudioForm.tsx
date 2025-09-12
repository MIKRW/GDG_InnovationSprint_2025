
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { uploadMasterAudio } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { TestAudioMetadata } from '@/lib/types';
import { kebabCase } from 'lodash';


const formSchema = z.object({
    commonName: z.string().min(2, "Common name is required."),
    scientificName: z.string().min(2, "Scientific name is required."),
    family: z.string().min(2, "Family is required."),
    order: z.string().min(2, "Order is required."),
    description: z.string().min(10, "Please provide a brief description of the recording."),
    audioFile: z.instanceof(FileList).refine(files => files?.length === 1, "Audio file is required."),
});

interface NewMasterAudioFormProps {
    onUploadSuccess: (metadata: TestAudioMetadata) => void;
}

export function NewMasterAudioForm({ onUploadSuccess }: NewMasterAudioFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            commonName: '',
            scientificName: '',
            family: '',
            order: '',
            description: '',
        }
    });

    const fileRef = form.register("audioFile");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        const file = values.audioFile[0];
        if (!file) {
            setIsLoading(false);
            return;
        };

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            
            try {
                const birdId = kebabCase(values.commonName);

                const newMetadata = await uploadMasterAudio({
                    birdId: birdId,
                    commonName: values.commonName,
                    scientificName: values.scientificName,
                    family: values.family,
                    order: values.order,
                    audioFile: base64Audio,
                    audioFileName: file.name,
                    description: values.description,
                });

                toast({
                    title: "Upload Successful",
                    description: "New master audio file has been added to the library.",
                });

                onUploadSuccess(newMetadata);

            } catch (error) {
                console.error("Failed to upload master audio:", error);
                 toast({
                    variant: 'destructive',
                    title: "Upload Failed",
                    description: "Could not add the new master audio file. Please try again.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            console.error('Failed to read file');
            toast({
                variant: 'destructive',
                title: 'File Read Error',
                description: 'Could not read the selected audio file.',
            });
            setIsLoading(false);
        };
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="audioFile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Master Audio File (.wav, .mp3)</FormLabel>
                            <FormControl>
                                <Input type="file" accept="audio/wav, audio/mpeg" {...fileRef} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="commonName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Common Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Australian Magpie" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="scientificName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Scientific Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Gymnorhina tibicen" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="family"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Family</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Artamidae" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="order"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Order</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Passeriformes" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Recording Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the recording context, e.g., 'Clear warbling call in a forest setting.'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload and Add to Library
                </Button>
            </form>
        </Form>
    );
}
