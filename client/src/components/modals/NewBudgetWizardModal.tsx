import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import { FaUtensils, FaCar, FaHome, FaShoppingCart, FaPiggyBank, FaBolt, FaRegSmile, FaRegMoneyBillAlt, FaRegHeart, FaRegStar, FaRegSun, FaRegMoon, FaRegLightbulb, FaRegGem, FaRegBell, FaRegCalendarAlt, FaRegClock, FaRegCreditCard, FaRegListAlt, FaRegChartBar, FaRegEnvelope, FaRegFileAlt, FaRegFolderOpen, FaRegUser, FaRegThumbsUp, FaRegThumbsDown, FaRegCheckCircle, FaRegTimesCircle } from "react-icons/fa";

const ICONS = [
  { name: "Groceries", icon: FaShoppingCart },
  { name: "Dining", icon: FaUtensils },
  { name: "Transport", icon: FaCar },
  { name: "Home", icon: FaHome },
  { name: "Savings", icon: FaPiggyBank },
  { name: "Utilities", icon: FaBolt },
  { name: "Fun", icon: FaRegSmile },
  { name: "Income", icon: FaRegMoneyBillAlt },
  { name: "Health", icon: FaRegHeart },
  { name: "Favorites", icon: FaRegStar },
  { name: "Day", icon: FaRegSun },
  { name: "Night", icon: FaRegMoon },
  { name: "Ideas", icon: FaRegLightbulb },
  { name: "Luxury", icon: FaRegGem },
  { name: "Alerts", icon: FaRegBell },
  { name: "Calendar", icon: FaRegCalendarAlt },
  { name: "Time", icon: FaRegClock },
  { name: "Credit", icon: FaRegCreditCard },
  { name: "List", icon: FaRegListAlt },
  { name: "Charts", icon: FaRegChartBar },
  { name: "Mail", icon: FaRegEnvelope },
  { name: "Files", icon: FaRegFileAlt },
  { name: "Folders", icon: FaRegFolderOpen },
  { name: "User", icon: FaRegUser },
  { name: "Thumbs Up", icon: FaRegThumbsUp },
  { name: "Thumbs Down", icon: FaRegThumbsDown },
  { name: "Check", icon: FaRegCheckCircle },
  { name: "Times", icon: FaRegTimesCircle },
];

const COLOR_PRESETS = [
  { hex: "#10B981", name: "Emerald" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#F59E0B", name: "Amber" },
  { hex: "#EF4444", name: "Red" },
  { hex: "#9333EA", name: "Purple" },
  { hex: "#F472B6", name: "Pink" },
  { hex: "#FBBF24", name: "Yellow" },
  { hex: "#6366F1", name: "Indigo" },
];

const RECUR_OPTIONS = [
  { label: "No Recurrence", value: "none", icon: <CheckCircle2 className="w-5 h-5 mr-2 text-muted-foreground" /> },
  { label: "Weekly", value: "weekly", icon: <FaRegCalendarAlt className="w-5 h-5 mr-2 text-blue-500" /> },
  { label: "Monthly", value: "monthly", icon: <FaRegCalendarAlt className="w-5 h-5 mr-2 text-purple-500" /> },
  { label: "Custom", value: "custom", icon: <Sparkles className="w-5 h-5 mr-2 text-yellow-500" /> },
];

const steps = [
  "intro",
  "title",
  "amount",
  "icon",
  "color",
  "recurring",
  "done",
];

const stepLabels = [
  "Welcome",
  "Title",
  "Amount",
  "Icon",
  "Color",
  "Recurrence",
  "Done",
];

interface NewBudgetWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewBudgetWizardModal({ open, onOpenChange }: NewBudgetWizardModalProps) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [color, setColor] = useState(COLOR_PRESETS[0].hex);
  const [recurring, setRecurring] = useState(RECUR_OPTIONS[0].value);
  const [customColor, setCustomColor] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setStep(0);
      setTitle("");
      setAmount("");
      setIconSearch("");
      setSelectedIcon(null);
      setColor(COLOR_PRESETS[0].hex);
      setRecurring(RECUR_OPTIONS[0].value);
      setCustomColor("");
      setShowConfetti(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (step === 6) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [step]);

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return ICONS;
    return ICONS.filter(i => i.name.toLowerCase().includes(iconSearch.toLowerCase()));
  }, [iconSearch]);

  const canNext = () => {
    if (step === 1) return !!title.trim();
    if (step === 2) return !!amount && !isNaN(Number(amount)) && Number(amount) > 0;
    if (step === 3) return !!selectedIcon;
    if (step === 4) return !!color;
    if (step === 5) return !!recurring;
    return true;
  };

  const handleNext = () => {
    if (step < steps.length - 1 && canNext()) setStep(s => s + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };
  const handleDone = () => {
    onOpenChange(false);
  };

  // Stepper
  const Stepper = () => (
    <div className="w-full pt-8 pb-6 px-4">
      <div className="flex items-center justify-between mb-3">
        {stepLabels.slice(0, -1).map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className={`text-xs font-medium mb-1 ${i === step ? 'text-green-700' : 'text-gray-400'}`}>{label}</div>
            <div className={`w-7 h-7 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${i === step ? 'bg-green-500 border-green-500 text-white scale-110 shadow' : 'bg-white border-gray-300 text-gray-400'}`}>{i + 1}</div>
          </div>
        ))}
      </div>
      <div className="relative h-1 w-full bg-gray-200 rounded-full">
        <div className="absolute top-0 left-0 h-1 bg-green-500 rounded-full transition-all duration-300" style={{ width: `${(step / (steps.length - 2)) * 100}%` }} />
      </div>
    </div>
  );

  // Step container (no card, just modal styling)
  const StepContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full max-w-md flex flex-col items-center justify-center px-2 sm:px-8 py-2 mx-auto min-h-[420px] animate-fade-in">
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl shadow-2xl border-0 bg-white p-0">
        <Stepper />
        {/* Step 1: Inspirational message */}
        {step === 0 && (
          <StepContainer>
            <DialogHeader className="w-full text-center">
              <DialogTitle className="text-3xl font-extrabold mb-4 text-green-700 flex flex-col items-center justify-center gap-2">
                <span className="inline-flex items-center justify-center"><Sparkles className="w-7 h-7 text-yellow-400 mr-2" />A journey of a thousand miles begins with one step...</span>
              </DialogTitle>
              <DialogDescription className="mb-8 text-lg text-gray-600">
                We're here to take that step with you toward a better financial future.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 flex justify-center w-full">
              {/* Piggy bank SVG */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="60" cy="70" rx="40" ry="30" fill="#D1FAE5" />
                <ellipse cx="60" cy="70" rx="32" ry="22" fill="#6EE7B7" />
                <ellipse cx="60" cy="70" rx="24" ry="14" fill="#34D399" />
                <rect x="52" y="50" width="16" height="8" rx="4" fill="#10B981" />
                <ellipse cx="60" cy="50" rx="8" ry="4" fill="#A7F3D0" />
                <circle cx="60" cy="70" r="6" fill="#059669" />
                <ellipse cx="80" cy="80" rx="4" ry="2" fill="#059669" />
                <ellipse cx="40" cy="80" rx="4" ry="2" fill="#059669" />
                <ellipse cx="60" cy="100" rx="10" ry="3" fill="#D1FAE5" />
                <circle cx="60" cy="70" r="2" fill="#fff" />
              </svg>
            </div>
            <div className="w-full flex flex-col items-center justify-end mt-8">
              <Button size="lg" onClick={handleNext} className="w-full max-w-xs text-lg font-semibold shadow-md">Get Started</Button>
              <div className="h-6" />
            </div>
          </StepContainer>
        )}
        {/* Step 2: Title */}
        {step === 1 && (
          <StepContainer>
            <DialogHeader className="w-full text-center">
              <DialogTitle className="text-2xl font-bold mb-4 text-gray-800">Give your budget a title</DialogTitle>
              <DialogDescription className="mb-10 text-base text-gray-500">What would you like to call this budget?</DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              placeholder="e.g. Groceries, Rent, Fun Money"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full max-w-lg mx-auto mb-12 text-lg py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
            <div className="w-full flex flex-row gap-4 justify-center items-center mt-auto">
              <Button variant="ghost" size="lg" onClick={handleBack} className="w-1/2"> <ChevronLeft className="mr-1 h-5 w-5" />Back</Button>
              <Button size="lg" onClick={handleNext} disabled={!canNext()} className="w-1/2 bg-green-500 hover:bg-green-600 text-white font-semibold">Next<ChevronRight className="ml-1 h-5 w-5" /></Button>
            </div>
            <div className="h-6" />
          </StepContainer>
        )}
        {/* Step 3: Amount */}
        {step === 2 && (
          <StepContainer>
            <DialogHeader className="w-full text-center">
              <DialogTitle className="text-2xl font-bold mb-4 text-gray-800">Set your budget amount</DialogTitle>
              <DialogDescription className="mb-10 text-base text-gray-500">How much do you want to allocate for this budget?</DialogDescription>
            </DialogHeader>
            <div className="relative w-full mb-12 flex justify-center">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 text-lg py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-100 max-w-full"
                style={{maxWidth:'400px'}}
              />
            </div>
            <div className="w-full flex flex-row gap-4 justify-center items-center mt-auto">
              <Button variant="ghost" size="lg" onClick={handleBack} className="w-1/2"> <ChevronLeft className="mr-1 h-5 w-5" />Back</Button>
              <Button size="lg" onClick={handleNext} disabled={!canNext()} className="w-1/2 bg-green-500 hover:bg-green-600 text-white font-semibold">Next<ChevronRight className="ml-1 h-5 w-5" /></Button>
            </div>
            <div className="h-6" />
          </StepContainer>
        )}
        {/* Step 4: Icon Picker */}
        {step === 3 && (
          <StepContainer>
            <DialogHeader className="w-full">
              <DialogTitle className="text-2xl font-bold mb-3 text-gray-800">Choose an icon</DialogTitle>
              <DialogDescription className="mb-8 text-base text-gray-500">Pick an icon that represents this budget.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Search icons..."
              value={iconSearch}
              onChange={e => setIconSearch(e.target.value)}
              className="max-w-xs mx-auto mb-8 text-base py-2 px-3 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-5 max-h-56 overflow-y-auto mb-8 w-full">
              {filteredIcons.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  className={`group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-green-200 ${selectedIcon === name ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200 hover:bg-gray-100'}`}
                  onClick={() => setSelectedIcon(name)}
                  aria-label={name}
                >
                  <div className="relative">
                    <Icon className="w-8 h-8 mb-1 text-gray-700 group-hover:scale-110 transition-transform" />
                    {selectedIcon === name && <Check className="w-5 h-5 text-green-500 absolute -top-2 -right-2 bg-white rounded-full shadow" />}
                  </div>
                  <span className="text-xs truncate w-full mt-1 text-gray-600">{name}</span>
                </button>
              ))}
            </div>
            <DialogFooter className="w-full flex justify-between mt-10">
              <Button variant="ghost" size="lg" onClick={handleBack}><ChevronLeft className="mr-1 h-5 w-5" />Back</Button>
              <Button size="lg" onClick={handleNext} disabled={!canNext()} className="bg-green-500 hover:bg-green-600 text-white font-semibold">Next<ChevronRight className="ml-1 h-5 w-5" /></Button>
            </DialogFooter>
          </StepContainer>
        )}
        {/* Step 5: Color Picker */}
        {step === 4 && (
          <StepContainer>
            <DialogHeader className="w-full">
              <DialogTitle className="text-2xl font-bold mb-3 text-gray-800">Pick a color</DialogTitle>
              <DialogDescription className="mb-8 text-base text-gray-500">Choose a color for your budget category.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-4 justify-center mb-8 w-full">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  className={`w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-green-200 ${color === preset.hex ? 'border-green-500 ring-2 ring-green-200 scale-110 shadow-lg' : 'border-gray-200 hover:scale-105'}`}
                  style={{ backgroundColor: preset.hex }}
                  onClick={() => { setColor(preset.hex); setCustomColor(""); }}
                  aria-label={preset.name}
                  title={preset.name}
                >
                  {color === preset.hex && <Check className="w-7 h-7 text-white drop-shadow" />}
                  <span className="text-xs mt-2 text-gray-700 font-medium select-none pointer-events-none" style={{textShadow:'0 1px 2px #fff8'}}>{preset.name}</span>
                </button>
              ))}
              {/* Custom color input */}
              <div className="flex flex-col items-center justify-center">
                <input
                  type="color"
                  value={customColor || color}
                  onChange={e => { setColor(e.target.value); setCustomColor(e.target.value); }}
                  className="w-14 h-14 rounded-full border-4 border-gray-200 cursor-pointer"
                  aria-label="Custom color"
                  title="Custom color"
                />
                <span className="text-xs mt-2 text-gray-700 font-medium select-none pointer-events-none">Custom</span>
              </div>
            </div>
            <DialogFooter className="w-full flex justify-between mt-10">
              <Button variant="ghost" size="lg" onClick={handleBack}><ChevronLeft className="mr-1 h-5 w-5" />Back</Button>
              <Button size="lg" onClick={handleNext} disabled={!canNext()} className="bg-green-500 hover:bg-green-600 text-white font-semibold">Next<ChevronRight className="ml-1 h-5 w-5" /></Button>
            </DialogFooter>
          </StepContainer>
        )}
        {/* Step 6: Recurring Logic */}
        {step === 5 && (
          <StepContainer>
            <DialogHeader className="w-full">
              <DialogTitle className="text-2xl font-bold mb-3 text-gray-800">Set up recurring logic</DialogTitle>
              <DialogDescription className="mb-8 text-base text-gray-500">How often should this budget reset?</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto mb-8">
              {RECUR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-full py-3 rounded-xl border-2 flex items-center justify-center text-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-200 ${recurring === opt.value ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:bg-gray-100'}`}
                  onClick={() => setRecurring(opt.value)}
                  aria-label={opt.label}
                >
                  {opt.icon}
                  {opt.label}
                  {recurring === opt.value && <Check className="w-5 h-5 text-green-500 ml-2" />}
                </button>
              ))}
            </div>
            <DialogFooter className="w-full flex justify-between mt-10">
              <Button variant="ghost" size="lg" onClick={handleBack}><ChevronLeft className="mr-1 h-5 w-5" />Back</Button>
              <Button size="lg" onClick={handleNext} disabled={!canNext()} className="bg-green-500 hover:bg-green-600 text-white font-semibold">Next<ChevronRight className="ml-1 h-5 w-5" /></Button>
            </DialogFooter>
          </StepContainer>
        )}
        {/* Step 7: Completion */}
        {step === 6 && (
          <StepContainer>
            <DialogHeader className="w-full">
              <DialogTitle className="text-3xl font-extrabold mb-4 text-green-600 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-500 animate-pulse" />
                Amazing!
              </DialogTitle>
              <DialogDescription className="mb-8 text-lg text-gray-600">You've created a new category for your budget.</DialogDescription>
            </DialogHeader>
            <div className="my-4 relative">
              <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="56" fill="#10B981" fillOpacity="0.1" />
                <path d="M40 80L60 40L80 80" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="60" cy="34" r="4" fill="#10B981" />
              </svg>
              {showConfetti && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
                  {[...Array(18)].map((_, i) => (
                    <span
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 10 + Math.random() * 10,
                        height: 10 + Math.random() * 10,
                        background: COLOR_PRESETS[i % COLOR_PRESETS.length].hex,
                        left: `${30 + Math.random() * 60}%`,
                        top: `${30 + Math.random() * 60}%`,
                        opacity: 0.7,
                        zIndex: 10,
                        filter: 'blur(0.5px)'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="w-full flex justify-center mt-10">
              <Button size="lg" onClick={handleDone} className="w-full max-w-xs text-lg font-semibold shadow-md bg-gradient-to-r from-green-400 to-blue-400 text-white">Done</Button>
            </DialogFooter>
          </StepContainer>
        )}
      </DialogContent>
    </Dialog>
  );
} 