import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const DeliveryRegisterPage = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplicationSuccess, setIsApplicationSuccess] = useState(false);
  const { toast } = useToast();
  const { user, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.username || "",
    email: user?.email || "",
    phone: "",
    vehicleType: "",
    licenseNumber: "",
    areas: [], // This will be a comma-separated string initially, then split
    aadharCard: null as File | null,
    panCard: null as File | null,
    drivingLicense: null as File | null,
  });

  const [uploadedDocUrls, setUploadedDocUrls] = useState<{ aadharCard: string | null; panCard: string | null; drivingLicense: string | null }>({
    aadharCard: null,
    panCard: null,
    drivingLicense: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        [id]: files[0],
      }));
    }
  };

  const handleNext = () => {
    // Basic validation for current step before proceeding
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast({
          title: "Error",
          description: "Please fill in all required fields for Step 1.",
          variant: "destructive",
        });
        return;
      }
    }
    if (step === 2) {
      if (!formData.vehicleType || !formData.licenseNumber || formData.areas.length === 0) {
        toast({
          title: "Error",
          description: "Please fill in all required fields for Step 2.",
          variant: "destructive",
        });
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.aadharCard || !formData.panCard || !formData.drivingLicense) {
      toast({
        title: "Error",
        description: "Please upload all required documents (Aadhar, PAN, Driving License).",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const aadharCardImageUrl = await uploadImageToCloudinary(formData.aadharCard);
      const panCardImageUrl = await uploadImageToCloudinary(formData.panCard);
      const drivingLicenseImageUrl = await uploadImageToCloudinary(formData.drivingLicense);

      setUploadedDocUrls({ aadharCard: aadharCardImageUrl, panCard: panCardImageUrl, drivingLicense: drivingLicenseImageUrl });

      const response = await api.post("/delivery/apply", {
        vehicleType: formData.vehicleType,
        licenseNumber: formData.licenseNumber,
        areas: formData.areas.map(area => area.trim()),
        aadharCardImageUrl,
        panCardImageUrl,
        drivingLicenseImageUrl,
      });

      if (response.status === 200) {
        setIsApplicationSuccess(true);
        toast({
          title: "Application Submitted!",
          description: "Your delivery partner application has been submitted successfully.",
        });
        fetchUserProfile();
      }
    } catch (error: any) {
      console.error("Delivery application error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  if (isApplicationSuccess) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Check className="h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-muted-foreground mb-4">
            Your delivery partner application has been submitted successfully.
            Our admin team will review it within 24-48 hours.
          </p>
          <Button onClick={() => navigate("/profile")}>Go to Profile</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl shadow-medium p-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold font-display">Become a Delivery Partner</h1>
              <p className="text-muted-foreground mt-2">
                Join our team and earn by delivering delicious sweets!
              </p>
            </div>

            <div className="relative mb-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10" />
              <div className="flex justify-between items-center">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      ${s === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                      ${s < step ? "bg-green-500 text-white" : ""}
                    `}
                  >
                    {s < step ? <Check className="h-5 w-5" /> : s}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" type="text" value={formData.name} onChange={handleInputChange} disabled={!!user?.username} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} disabled={!!user?.email} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="e.g., +919876543210" required />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicleType: value }))} value={formData.vehicleType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bike">Bike</SelectItem>
                        <SelectItem value="scooter">Scooter</SelectItem>
                        <SelectItem value="bicycle">Bicycle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">Driving License Number</Label>
                    <Input id="licenseNumber" type="text" value={formData.licenseNumber} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="areas">Preferred Delivery Areas (comma-separated)</Label>
                    <Input
                      id="areas"
                      type="text"
                      value={formData.areas.join(', ')}
                      onChange={(e) => setFormData((prev) => ({ ...prev, areas: e.target.value.split(',').map(area => area.trim()) }))}
                      placeholder="e.g., Jayanagar, Koramangala, BTM Layout"
                      required
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aadharCard">Aadhar Card (Front & Back)</Label>
                    <div className="flex items-center space-x-2">
                      <Input id="aadharCard" type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="flex-1" required />
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <UploadCloud className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="panCard">PAN Card</Label>
                    <div className="flex items-center space-x-2">
                      <Input id="panCard" type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="flex-1" required />
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <UploadCloud className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="drivingLicense">Driving License</Label>
                    <div className="flex items-center space-x-2">
                      <Input id="drivingLicense" type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="flex-1" required />
                      <Button type="button" variant="outline" size="icon" className="shrink-0">
                        <UploadCloud className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                )}
                {step < 3 && (
                  <Button type="button" onClick={handleNext} className="ml-auto">
                    Next
                  </Button>
                )}
                {step === 3 && (
                  <Button type="submit" className="ml-auto" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};
