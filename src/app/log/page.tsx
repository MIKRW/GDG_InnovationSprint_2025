
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, useCarousel } from '@/components/ui/carousel';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookImage, Settings, Home, Bot, Mic } from 'lucide-react';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSpeaker } from '@/hooks/use-speaker';

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

const PAGE_NARRATION = "This is the Bird Book, your personal log of identified birds. You can swipe left and right to view your saved identifications. The first card is the AI assistant, which can help you filter, sort, or find birds in your log. Click the bot icon to start a voice command, or toggle to text control at the bottom.";


function AiAssistantCard({ 
    isChatActive, 
    onToggleChat,
    chatMode 
}: { 
    isChatActive: boolean, 
    onToggleChat: () => void,
    chatMode: 'voice' | 'text'
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'bot', text: 'Please ask me to filter, sort, or find a bird.' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            setMessages(prev => [...prev, { sender: 'user', text: input }]);
            // Here you would call the AI and get a response
            setInput('');
        }
    };

    return (
        <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-4 p-2">
                     {chatMode === 'voice' || !isChatActive ? (
                        <>
                            <div className="w-48 h-48">
                                <Button variant="ghost" className={cn("w-full h-full rounded-full hover:bg-background", isChatActive && "animate-pulse bg-background")} onClick={onToggleChat}>
                                    <Bot className="h-48 w-48 text-foreground" />
                                </Button>
                            </div>
                            <div className="text-center">
                                <h2 className="text-5xl font-mono font-bold">Bird Book</h2>
                                <p className="text-lg font-mono text-foreground/80">
                                    {isChatActive ? "Listening..." : "Click the icon to give a command"}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col p-4">
                            <CardHeader className="text-center p-2">
                                <CardTitle className="text-2xl font-mono">Bird Book Guide</CardTitle>
                            </CardHeader>
                            <div className="flex-1 space-y-4 overflow-y-auto bg-muted/50 p-4 rounded-md">
                                {messages.map((msg, index) => (
                                    <div key={index} className={cn("flex", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                        <div className={cn("rounded-lg px-4 py-2 max-w-xs", msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Input 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your command..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <Button onClick={handleSend}>Send</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function BirdResultCard({ seed, onStartChat }: { seed: string, onStartChat: () => void }) {
    return (
        <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                <div className="relative w-full flex-1 pt-4">
                    <Image
                        src={`https://picsum.photos/seed/${seed}/600/400`}
                        alt="A picture of a bird"
                        fill
                        className="object-contain rounded-t-lg"
                        data-ai-hint="bird nature"
                    />
                </div>
                <div className="flex flex-col flex-1">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-mono">Sparrow</CardTitle>
                        <CardDescription className="text-lg italic font-mono">Passer domesticus</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-muted-foreground">
                            A small, common bird found in most parts of the world. Sparrows are known for their cheerful chirping and social nature.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-1 justify-center items-center">
                        <Button variant="ghost" size="icon" onClick={onStartChat} className="h-24 w-24">
                            <Bot className="h-20 w-20" />
                        </Button>
                    </CardFooter>
                </div>
            </Card>
        </div>
    );
}

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn("absolute top-1/2 -translate-y-1/2 h-20 w-20 -left-24", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label="Previous slide"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-ring">
            <path d="M 80,5 20,50 80,95 Z" />
        </svg>
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn("absolute top-1/2 -translate-y-1/2 h-20 w-20 -right-24", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      aria-label="Next slide"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-ring">
            <path d="M 20,5 80,50 20,95 Z" />
        </svg>
    </button>
  );
});
CarouselNext.displayName = "CarouselNext"

export default function BirdBookPage() {
    const [api, setApi] = useState<CarouselApi>();
    const [isChatActive, setIsChatActive] = useState(false);
    const [chatMode, setChatMode] = useState<'voice' | 'text'>('voice');
    const [isClient, setIsClient] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('light');
    const { playNarration, ...speakerProps } = useSpeaker(PAGE_NARRATION);

    useEffect(() => {
        setIsClient(true);
        setCurrentTheme(localStorage.getItem('theme') || 'light');
    }, []);

    useEffect(() => {
        if (!api) return;
        
        const onSelect = () => {
            // Deactivate chat if we scroll away from the assistant card
            if (api.selectedScrollSnap() !== 0) {
                setIsChatActive(false);
            }
        };

        api.on("select", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);
    
    const startChat = () => {
        api?.scrollTo(0);
        setIsChatActive(true);
    };

    const handleToggleChat = () => {
        // If chat is active anywhere, this button will deactivate it.
        // If chat is inactive and we are on the main card, it will activate it.
        if (isChatActive) {
            setIsChatActive(false);
        } else if (api?.selectedScrollSnap() === 0) {
            setIsChatActive(true);
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <AppLayout>
            <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
                <div className="absolute top-4 left-4 opacity-50">
                    <SpeakerButton onClick={playNarration} {...speakerProps} />
                </div>
                <div className="absolute top-4 right-4 opacity-50">
                    <ContrastButton key={currentTheme} />
                </div>

                <Carousel className="w-full max-w-lg" opts={{ loop: false }} setApi={setApi}>
                    <CarouselContent className="h-[34rem]">
                        <CarouselItem>
                            <div className="p-1 h-full">
                                <AiAssistantCard 
                                    isChatActive={isChatActive} 
                                    onToggleChat={handleToggleChat} 
                                    chatMode={chatMode} 
                                />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-full">
                               <BirdResultCard seed="bird1" onStartChat={startChat} />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-full">
                                <BirdResultCard seed="bird2" onStartChat={startChat} />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-full">
                               <BirdResultCard seed="bird3" onStartChat={startChat} />
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>

                <div className="absolute bottom-4 left-4 opacity-50">
                    <Link href="/log">
                        <Button variant="ghost" size="icon" className="h-28 w-28">
                            <BookImage className="h-20 w-20 text-foreground" />
                        </Button>
                    </Link>
                </div>
                
                <div className="absolute bottom-12 inset-x-0 flex justify-center">
                    <Button
                        onClick={() => setChatMode(chatMode === 'voice' ? 'text' : 'voice')}
                        variant={chatMode === 'text' ? 'secondary' : 'default'}
                        className="rounded-full px-8 py-4 text-lg font-semibold transition-colors duration-300"
                    >
                        {chatMode === 'voice' ? 'Voice Controlled' : 'Text Controlled'}
                    </Button>
                </div>

                <div className="absolute bottom-4 right-4 opacity-50">
                    <Link href="/">
                      <Button
                        variant='ghost'
                        size='icon'
                        className="h-28 w-28"
                      >
                        <Home className="h-20 w-20 text-foreground" />
                      </Button>
                    </Link>
                </div>
            </main>
        </AppLayout>
    );
}

    

    

    