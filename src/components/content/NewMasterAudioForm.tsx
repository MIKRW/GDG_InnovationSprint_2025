

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { uploadMasterAudio } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { TestAudioMetadata } from '@/lib/types';
import { kebabCase } from 'lodash';
import { ScrollArea } from '../ui/scroll-area';


const formSchema = z.object({
    commonName: z.string().min(2, "Common name is required."),
    genus: z.string().min(2, "Genus is required."),
    species: z.string().min(2, "Species is required."),
    family: z.string().min(2, "Family is required."),
    order: z.string().min(2, "Order is required."),
    description: z.string().min(10, "Please provide a brief description of the recording."),
    audioFile: z.any(),
    sourceUrl: z.string().url().optional().or(z.literal('')),
    author: z.string().optional(),
    license: z.string().optional(),
    hardware: z.string().optional(),
    location: z.string().optional(),
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
            genus: '',
            species: '',
            family: '',
            order: '',
            description: '',
            sourceUrl: '',
            author: '',
            license: '',
            hardware: '',
            location: '',
        }
    });

    const fileRef = form.register("audioFile");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        const file = values.audioFile?.[0];
        if (!file) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Audio file is required.',
            });
            setIsLoading(false);
            return;
        };

        const getDuration = (file: File): Promise<number> => {
            return new Promise((resolve) => {
                const audio = document.createElement('audio');
                audio.src = URL.createObjectURL(file);
                audio.addEventListener('loadedmetadata', () => {
                    resolve(parseFloat(audio.duration.toFixed(2)));
                });
            });
        };

        const duration = await getDuration(file);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            
            try {
                const birdId = kebabCase(values.commonName);
                const scientificName = `${values.genus} ${values.species}`;

                const newMetadata = await uploadMasterAudio({
                    birdId: birdId,
                    commonName: values.commonName,
                    genus: values.genus,
                    species: values.species,
                    scientificName: scientificName,
                    family: values.family,
                    order: values.order,
                    audioFile: base64Audio,
                    audioFileName: file.name,
                    description: values.description,
                    duration: duration,
                    sourceUrl: values.sourceUrl,
                    author: values.author,
                    license: values.license,
                    hardware: values.hardware,
                    location: values.location,
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
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[28rem] pr-6">
                    <div className="space-y-4">
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
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="genus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Genus</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Gymnorhina" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="species"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Species</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., tibicen" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
                                        <Textarea placeholder="Please describe the audio. Is it a warning call, a melody, a single bird, or multiple?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <h3 className="text-lg font-semibold pt-4 border-b pb-2">Optional Metadata</h3>
                        
                        <FormField
                            control={form.control}
                            name="sourceUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Source URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com/audio-source" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The web page where the original audio was found.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="author"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Author / Recordist</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="license"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>License</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., CC BY-SA 4.0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="hardware"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recording Hardware</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Zoom H5, Sennheiser ME66" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recording Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Fryers Forest, VIC, Australia" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </ScrollArea>
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload and Add to Library
                </Button>
            </form>
        </Form>
    );
}
