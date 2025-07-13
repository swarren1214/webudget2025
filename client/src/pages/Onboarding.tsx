import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { createPlaidLinkToken, exchangePlaidPublicToken } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [plaidLinked, setPlaidLinked] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // 🐛 DEBUG: Session state on component mount
  useEffect(() => {
    console.log('🔍 [Onboarding] Component mounted - checking session state...');
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔍 [Onboarding] Session on mount:', {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id,
        hasAccessToken: !!sessionData.session?.access_token,
        accessTokenLength: sessionData.session?.access_token?.length,
        userEmail: sessionData.session?.user?.email,
        timestamp: new Date().toISOString()
      });
    };
    checkSession();
  }, []);

  // Get link token when step 2 is reached
  useEffect(() => {
    if (step === 2 && !linkToken) {
      console.log('🔍 [Onboarding] Step 2 reached - BEFORE createPlaidLinkToken API call...');
      
      // Check session again right before API call
      const checkSessionBeforeAPI = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('🔍 [Onboarding] Session RIGHT BEFORE API call:', {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          hasAccessToken: !!sessionData.session?.access_token,
          accessTokenLength: sessionData.session?.access_token?.length,
          timestamp: new Date().toISOString()
        });

        // Now make the API call
        try {
          console.log('🔍 [Onboarding] CALLING createPlaidLinkToken now...');
          const data = await createPlaidLinkToken();
          console.log('🔍 [Onboarding] createPlaidLinkToken SUCCESS:', data);
          setLinkToken(data.linkToken);
        } catch (error) {
          console.error('🔍 [Onboarding] createPlaidLinkToken FAILED:', error);
        }
      };

      checkSessionBeforeAPI();
    }
  }, [step, linkToken]);

  // ✅ BEST PRACTICE: Conditional hook initialization to prevent race conditions
  // usePlaidLink requires a token, so we provide fallback when linkToken is not ready
  const { open, ready } = usePlaidLink({
    token: linkToken || '', // Fallback to empty string when linkToken is null
    onSuccess: (public_token: string, metadata: any) => {
      exchangePlaidPublicToken(public_token, 1);
      setPlaidLinked(true);
      setStep(step + 1);
    },
  });

  // ✅ IMMUTABLE STATE: Only consider ready when BOTH conditions are met
  const isPlaidReady = Boolean(linkToken) && ready;

  // Monitor Plaid Link readiness for debugging (remove in production)
  useEffect(() => {
    console.log('🔍 [Onboarding] Plaid Link state:', {
      hasToken: !!linkToken,
      ready,
      isPlaidReady,
      step
    });
  }, [linkToken, ready, isPlaidReady, step]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Upload Profile Photo</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="mb-4"
            />
            {profilePhoto && (
              <img
                src={URL.createObjectURL(profilePhoto)}
                alt="Preview"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
            )}
          </div>
        );
      case 2:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Bank Account</h2>
            <button
              onClick={() => {
                console.log('🔍 [Onboarding] Connect button clicked:', { isPlaidReady });
                if (isPlaidReady) {
                  open();
                }
              }}
              disabled={!isPlaidReady}
              className="py-2 px-4 bg-big-grinch text-white rounded-lg font-semibold hover:bg-green-700 transition"
              style={{ 
                opacity: !isPlaidReady ? 0.5 : 1,
                cursor: !isPlaidReady ? 'not-allowed' : 'pointer'
              }}
            >
              {plaidLinked ? 'Account Linked!' : 'Connect with Plaid'}
              {!isPlaidReady && <span className="ml-2 text-xs">(Loading...)</span>}
            </button>
          </div>
        );
      case 3:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">You're all set!</h2>
            <p>Welcome to WeBudget. Head to your dashboard to get started.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStepper = () => {
    const steps = ['Photo', 'Plaid'];
    return (
      <div className="flex justify-center mb-6">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`px-4 py-2 mx-2 rounded-full text-sm font-medium border-2 transition
              ${step === index + 1 ? 'bg-big-grinch text-white border-big-grinch' : 'border-gray-300 text-gray-500'}`}
          >
            Step {index + 1}: {label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-big-grinch text-gray-800">
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
          <div className="flex flex-col items-center mb-4">
            <img src="/appicon-rounded.png" alt="WeBudget Logo" className="w-16 h-16 mb-2" />
            <p className="text-gray-600">Let's finish setting up your account.</p>
          </div>

          {renderStepper()}
          {renderStepContent()}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1}
              className={`px-4 py-2 rounded-lg font-medium ${step === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
            >
              Back
            </button>
            {step < 3 && (
              <button
                onClick={() => setStep((prev) => prev + 1)}
                className="px-4 py-2 bg-big-grinch text-white rounded-lg font-medium hover:bg-green-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="py-6 text-white text-xs text-center">
        &copy; {new Date().getFullYear()} WeBudget. All rights reserved.
      </div>
    </div>
  );
};

export default OnboardingPage;
