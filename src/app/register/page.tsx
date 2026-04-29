"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Users, Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const [step, setStep] = useState<"type" | "form" | "claim">("type");
  const [userType, setUserType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Claim data
  const [csvMatches, setCsvMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [claimReason, setClaimReason] = useState("");
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [idDocument, setIdDocument] = useState<File | null>(null);

  const userTypes = [
    {
      value: "influencer",
      label: "Influencer",
      description: "Content creators and social media personalities",
    },
    {
      value: "brand",
      label: "Brand",
      description: "Companies looking for influencer partnerships",
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setClaimReason(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'proofImages' | 'idDocument') => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'proofImages') {
      setProofImages(Array.from(files));
    } else if (type === 'idDocument') {
      setIdDocument(files[0] || null);
    }
  };

  // Simple account creation without complex flows
  const createAccount = async () => {
    try {
      console.log('Creating account...');
      
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: userType,
      });

      if (error) {
        console.error('Signup error:', error);
        toast.error((error as any).message || "Failed to create account");
        return null;
      }

      console.log('Account created:', data?.user);
      
      toast.success("Account created successfully!");
      
      return data?.user;
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error("Failed to create account");
      return null;
    }
  };

  // Simple CSV matching
  const checkCSVMatches = async () => {
    try {
      console.log('Checking CSV matches...');
      
      const response = await fetch("/api/csv-influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
        }),
      });

      const data = await response.json();
      console.log('CSV response:', data);
      
      if (data.hasMatch) {
        setCsvMatches(data.matches);
        setStep("claim");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('CSV check error:', error);
      return false;
    }
  };

  // Upload files and get URLs
  const uploadFiles = async () => {
    const uploadedProofImages = [];
    let uploadedIdDocument = null;

    // Upload proof images
    for (const file of proofImages) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          uploadedProofImages.push({
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            originalName: data.originalName,
            size: data.size,
            type: data.type
          });
        } else {
          console.error('Failed to upload proof image:', data.error);
        }
      } catch (error) {
        console.error('Error uploading proof image:', error);
      }
    }

    // Upload ID document
    if (idDocument) {
      try {
        const formData = new FormData();
        formData.append('file', idDocument);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          uploadedIdDocument = {
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            originalName: data.originalName,
            size: data.size,
            type: data.type
          };
        } else {
          console.error('Failed to upload ID document:', data.error);
        }
      } catch (error) {
        console.error('Error uploading ID document:', error);
      }
    }

    return { uploadedProofImages, uploadedIdDocument };
  };

  // Simple claim submission
  const submitClaim = async () => {
    try {
      console.log('Submitting claim...');
      
      // Upload files first
      const { uploadedProofImages, uploadedIdDocument } = await uploadFiles();
      
      const response = await fetch("/api/profile-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Store registration data for account creation after approval
          registrationData: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            userType: userType,
          },
          csvRecordId: selectedMatch.csvRecordId,
          claimReason: claimReason,
          proofImages: uploadedProofImages, // Store uploaded file data
          idDocument: uploadedIdDocument, // Store uploaded file data
        }),
      });

      const data = await response.json();
      console.log('Claim response:', data);
      
      if (data.success) {
        toast.success("Claim submitted successfully! You'll be notified when it's reviewed.");
        window.location.href = `/claim-status?claimId=${data.claim.id}`;
      } else {
        toast.error("Failed to submit claim");
      }
    } catch (error) {
      console.error('Claim submission error:', error);
      toast.error("Failed to submit claim");
    }
  };

  // Main registration handler
  const handleRegistration = async () => {
    if (!userType) {
      toast.error("Please select account type");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    // Name should not contain numbers
    if (/\d/.test(formData.name)) {
      toast.error("Name cannot contain numbers");
      return;
    }

    // Name should not contain special characters (allowing spaces, hyphens, and apostrophes)
    if (/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]+/.test(formData.name)) {
      toast.error("Name cannot contain special characters");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      // If influencer, check for CSV matches FIRST before creating account
      if (userType === "influencer") {
        const hasMatches = await checkCSVMatches();
        if (hasMatches) {
          // Has matches, stay on claim step - don't create account yet
          setIsLoading(false);
          return;
        }
        // No matches, proceed to create account
      }

      // Create account only when needed
      const user = await createAccount();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Claim submission handler
  const handleClaimSubmission = async () => {
    if (!selectedMatch) {
      toast.error("Please select a profile");
          return;
    }

    if (!claimReason.trim()) {
      toast.error("Please provide a claim reason");
        return;
      }

    setIsLoading(true);

    try {
      // Submit claim WITHOUT creating account yet
      // Account will be created only after admin approval
      await submitClaim();
    } catch (error) {
      console.error('Claim submission error:', error);
      toast.error("Failed to submit claim");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoClaim = async () => {
    setIsLoading(true);

    try {
      // Create account directly without claiming any profile
      const result = await createAccount();
      
      if (result) {
      toast.success("Account created successfully!");
        // Redirect to dashboard or login page
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-muted-foreground">
              Join Splash and start your journey
            </p>
          </div>

          {/* Step 1: User Type Selection */}
          {step === "type" && (
            <div className="space-y-4">
              <div className="space-y-3">
                {userTypes.map((type) => (
                  <motion.div
                    key={type.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-colors ${
                        userType === type.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setUserType(type.value)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            {type.value === "brand" ? (
                              <Building2 className="h-6 w-6 text-primary" />
                            ) : (
                              <Users className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{type.label}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                </div>

              <Button
                onClick={() => setStep("form")}
                disabled={!userType}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === "form" && (
              <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                  placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                  placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("type")}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleRegistration}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Profile Claim */}
          {step === "claim" && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Potential Profile Match Found</h2>
                <p className="text-muted-foreground">
                  We found a profile that might match your information. Please review and choose your next step.
                </p>
              </div>

              {/* Profile Matches */}
              <div className="space-y-3">
                <Label>Select the profile that matches you:</Label>
                {csvMatches.map((match, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-colors ${
                      selectedMatch?.csvRecordId === match.csvRecordId
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                          {match.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{match.name}</h3>
                          <p className="text-sm text-muted-foreground">{match.category}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Claim Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="claimReason">Why should this profile belong to you?</Label>
                  <Textarea
                    id="claimReason"
                    placeholder="Explain why this profile belongs to you. Provide any relevant information..."
                    value={claimReason}
                    onChange={handleTextareaChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proofImages">Proof Images (Optional)</Label>
                  <Input
                    id="proofImages"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'proofImages')}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload screenshots or images that prove this profile belongs to you
                  </p>
                  {proofImages.length > 0 && (
                    <div className="text-sm text-green-600">
                      {proofImages.length} file(s) selected
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idDocument">ID Document (Optional)</Label>
                  <Input
                    id="idDocument"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'idDocument')}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a copy of your ID for verification
                  </p>
                  {idDocument && (
                    <div className="text-sm text-green-600">
                      File selected: {idDocument.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Don't see your profile? This might not be you.
                  </p>
              </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("form")}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
              <Button
                    type="button"
                    variant="secondary"
                    onClick={handleNoClaim}
                disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Creating..." : "This is Not Me - Create New Account"}
                  </Button>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={handleClaimSubmission}
                    disabled={isLoading || !selectedMatch || !claimReason.trim()}
                    className="flex-1"
                  >
                    {isLoading ? "Submitting..." : "Submit Claim"}
              </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Welcome */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary to-accent items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-white space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Welcome to Splash</h2>
            <p className="text-lg opacity-90">
              The ultimate platform connecting brands with influencers for authentic collaborations
                </p>
              </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 rounded-full bg-white/20">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Connect</h3>
              <p className="text-sm opacity-80">Find the perfect match</p>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 rounded-full bg-white/20">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Collaborate</h3>
              <p className="text-sm opacity-80">Build meaningful partnerships</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}