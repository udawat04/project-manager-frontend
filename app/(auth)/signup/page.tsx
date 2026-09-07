'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ProjectVault</h1>
          <p className="text-xs text-muted-foreground">
            Enterprise Secret & Environment Management
          </p>
        </div>

        <Card className="border border-border shadow-md">
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Public Registration Restricted</CardTitle>
            <CardDescription className="text-xs">
              Direct signups are disabled on this instance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-center text-xs text-muted-foreground pt-0">
            <p>
              To maintain zero-trust security standards, accounts must be provisioned by a system administrator through the backend command interface.
            </p>
            <p className="text-[11px] bg-muted/40 p-2.5 rounded border border-border/70">
              If you have already received your login credentials or need to reset your password, please proceed to the sign-in page.
            </p>
          </CardContent>
          <CardFooter className="pt-2">
            <Link href="/login" className="w-full">
              <Button className="w-full gap-1.5">
                <span>Go to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
