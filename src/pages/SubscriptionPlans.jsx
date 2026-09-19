import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Store, Bike, UserRound, Mail, ArrowRight } from 'lucide-react';

const plans = [
    {
        title: 'Customer',
        price: 'Free',
        period: 'Forever',
        description: 'Order your favourite street food without any subscription fee.',
        icon: UserRound,
        features: ['Browse restaurants and menus', 'Place food orders', 'Track your orders', 'Manage addresses and favourites'],
        cta: 'Start Ordering',
        href: '/signup',
        featured: false
    },
    {
        title: 'Restaurant',
        price: '₹300',
        period: 'per month',
        description: 'List and manage your restaurant on PANIPURI STORE.',
        icon: Store,
        features: ['Restaurant listing', 'Menu and category management', 'Receive and manage orders', 'Owner dashboard', 'Restaurant open/close control'],
        cta: 'Contact Support',
        href: 'mailto:support.origenix@gmail.com?subject=Restaurant%20Subscription%20-%20PANIPURI%20STORE&body=Hello%20PANIPURI%20STORE%20Support%2C%0A%0AI%20am%20interested%20in%20the%20Restaurant%20Subscription.%20Please%20share%20the%20registration%20and%20payment%20details.%0A%0AThank%20you.',
        featured: true
    },
    {
        title: 'Delivery Partner',
        price: '₹100',
        period: 'per month',
        description: 'Join as a delivery partner and manage assigned deliveries.',
        icon: Bike,
        features: ['Delivery partner access', 'Assigned order management', 'Order status updates', 'Delivery dashboard'],
        cta: 'Contact Support',
        href: 'mailto:support.origenix@gmail.com?subject=Delivery%20Partner%20Subscription%20-%20PANIPURI%20STORE&body=Hello%20PANIPURI%20STORE%20Support%2C%0A%0AI%20am%20interested%20in%20the%20Delivery%20Partner%20Subscription.%20Please%20share%20the%20registration%20and%20payment%20details.%0A%0AThank%20you.',
        featured: false
    }
];

const SubscriptionPlans = () => {
    return (
        <div className="min-h-screen bg-background pt-28 md:pt-36 pb-16">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-2 text-xs font-black uppercase tracking-widest mb-4">
                        PANIPURI STORE Plans
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
                        Simple plans for <span className="text-primary">everyone</span>
                    </h1>
                    <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed">
                        Customers can order for free. Restaurant and delivery partner subscriptions are available monthly.
                        To activate a paid plan, contact our support team.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <div
                                key={plan.title}
                                className={`relative rounded-3xl border p-6 md:p-8 bg-card shadow-sm hover:shadow-xl transition-all duration-300 ${plan.featured ? 'border-primary ring-2 ring-primary/10 md:-translate-y-2' : 'border-border'}`}
                            >
                                {plan.featured && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                        Restaurant Plan
                                    </div>
                                )}

                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <Icon className="w-7 h-7 text-primary" />
                                </div>

                                <h2 className="text-2xl font-black">{plan.title}</h2>
                                <p className="text-sm text-muted-foreground mt-2 min-h-[48px]">{plan.description}</p>

                                <div className="mt-7 flex items-end gap-2">
                                    <span className="text-4xl md:text-5xl font-black">{plan.price}</span>
                                    <span className="text-sm text-muted-foreground font-semibold mb-2">{plan.period}</span>
                                </div>

                                <div className="h-px bg-border my-7"></div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                                            </span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.href.startsWith('mailto:') ? (
                                    <a href={plan.href} className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-black transition-all ${plan.featured ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-muted hover:bg-border text-foreground'}`}>
                                        <Mail className="w-4 h-4" />
                                        {plan.cta}
                                    </a>
                                ) : (
                                    <Link to={plan.href} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-black bg-muted hover:bg-border text-foreground transition-all">
                                        {plan.cta}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 rounded-3xl bg-primary/5 border border-primary/15 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-black">Need a subscription?</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Contact our support team for restaurant or delivery partner registration and subscription activation.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a href="mailto:support.origenix@gmail.com?subject=PANIPURI%20STORE%20Subscription%20Support&body=Hello%20PANIPURI%20STORE%20Support%2C%0A%0AI%20have%20a%20subscription%20query.%20Please%20help%20me%20with%20the%20registration%20and%20subscription%20details.%0A%0AThank%20you." className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-black hover:bg-primary-hover transition-colors">
                                <Mail className="w-4 h-4" />
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Subscription activation and payment instructions will be provided by the PANIPURI STORE support team.
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
