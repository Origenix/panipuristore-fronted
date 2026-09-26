import React from 'react';
import { Download, Smartphone, ShieldCheck, Zap, CheckCircle2, ArrowDownToLine } from 'lucide-react';

const DownloadApp = () => {
    const handleDownload = () => {
        window.location.href = '/api/download-apk';
    };

    return (
        <div className="min-h-screen bg-background pt-28 md:pt-32 pb-20">
            <section className="section-padding">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl shadow-primary/10">
                    <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

                    <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center p-7 md:p-12 lg:p-16">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.16em] mb-6">
                                <Smartphone className="w-4 h-4" />
                                PanipuriStore Android App
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.02] mb-6">
                                PanipuriStore,
                                <span className="block gradient-text">in your pocket.</span>
                            </h1>

                            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
                                Get the latest PanipuriStore Android app directly from our website.
                                Enjoy a fast, mobile-first experience for browsing, ordering and managing your account.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 mb-9">
                                <button onClick={handleDownload} className="btn-primary px-7 py-4 text-base">
                                    <Download className="w-5 h-5" />
                                    Download Android App
                                </button>
                                <div className="btn-secondary px-5 py-4 text-sm cursor-default">
                                    <ShieldCheck className="w-5 h-5 text-success" />
                                    Official PanipuriStore build
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                                {[
                                    ['Latest build', 'Always served from the latest APK artifact'],
                                    ['Standalone', 'Install directly on compatible Android devices'],
                                    ['Secure', 'Delivered through a protected download endpoint'],
                                ].map(([title, text]) => (
                                    <div key={title} className="rounded-2xl bg-muted/70 border border-border p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-4 h-4 text-success" />
                                            <span className="font-extrabold text-sm">{title}</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="mx-auto max-w-md rounded-[2rem] border border-white/20 bg-gradient-to-br from-primary via-[#E64A19] to-accent p-[1px] shadow-2xl shadow-primary/20">
                                <div className="rounded-[1.95rem] bg-[#171717] p-6 md:p-8 text-white overflow-hidden">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                                <Smartphone className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black tracking-tight">PANIPURI STORE</p>
                                                <p className="text-xs text-white/50">Premium Street Food</p>
                                            </div>
                                        </div>
                                        <Zap className="w-5 h-5 text-accent" />
                                    </div>

                                    <div className="rounded-3xl bg-white/5 border border-white/10 p-5 mb-5">
                                        <p className="text-xs uppercase tracking-[0.18em] text-white/45 font-bold mb-2">Android App</p>
                                        <p className="text-2xl font-black mb-2">Ready to install</p>
                                        <p className="text-sm text-white/60 leading-relaxed">
                                            Download the current production APK with one tap.
                                        </p>
                                    </div>

                                    <button onClick={handleDownload} className="w-full rounded-2xl bg-white text-[#171717] py-4 px-5 font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform">
                                        <ArrowDownToLine className="w-5 h-5" />
                                        Get the latest APK
                                    </button>

                                    <p className="text-[11px] text-center text-white/35 mt-4">
                                        PanipuriStore official website download
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto mt-10 text-center">
                    <p className="text-xs md:text-sm text-muted-foreground">
                        If Android asks for permission to install an app from this source, review the permission and continue only if you trust the PanipuriStore website.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default DownloadApp;
