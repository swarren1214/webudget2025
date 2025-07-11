import React, { useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [plaidLinked, setPlaidLinked] = useState(false);

  // Simulated Plaid token for example purposes
  const { open, ready } = usePlaidLink({
    token: 'your-generated-link-token',
    onSuccess: (public_token, metadata) => {
      setPlaidLinked(true);
      setStep(step + 1);
    },
  });

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
              onClick={() => open()}
              disabled={!ready}
              className="py-2 px-4 bg-big-grinch text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              {plaidLinked ? 'Account Linked!' : 'Connect with Plaid'}
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
