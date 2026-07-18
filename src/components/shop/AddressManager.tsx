"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Home, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressSchema, type AddressInput } from "@/lib/validations/address";
import {
  saveAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/actions/addresses";

type SavedAddress = {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export function AddressManager({
  addresses: initialAddresses,
}: {
  addresses: SavedAddress[];
}) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    },
  });

  const onSubmit = async (data: AddressInput) => {
    setServerError(null);
    let result;
    if (editingId) {
      result = await updateAddress(editingId, data);
    } else {
      result = await saveAddress(data);
    }

    if (result.error) {
      setServerError(result.error);
    } else {
      // Revalidation will reload the page, but let's reset client UI state
      setShowForm(false);
      setEditingId(null);
      reset();
      window.location.reload(); // Quick sync
    }
  };

  const handleEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setShowForm(true);
    setServerError(null);

    setValue("label", addr.label || "");
    setValue("name", addr.name);
    setValue("phone", addr.phone);
    setValue("line1", addr.line1);
    setValue("line2", addr.line2 || "");
    setValue("city", addr.city);
    setValue("state", addr.state);
    setValue("pincode", addr.pincode);
    setValue("isDefault", addr.isDefault);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    const result = await deleteAddress(id);
    if (result.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
    setDeletingId(null);
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    const result = await setDefaultAddress(id);
    if (result.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
    setSettingDefaultId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-charcoal">Delivery Addresses</h2>
        {!showForm && (
          <Button
            type="button"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              reset();
            }}
            className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Address
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl bg-cream p-6 border border-linen/50 animate-fade-in"
        >
          <h3 className="font-heading text-lg text-charcoal">
            {editingId ? "Edit Address" : "Add Delivery Address"}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="label">Address Label (e.g. Home, Work)</Label>
              <Input id="label" placeholder="e.g. Home" {...register("label")} />
              {errors.label && (
                <p className="text-xs text-brand-red">{errors.label.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Receiver's Full Name</Label>
              <Input id="name" placeholder="John Doe" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-brand-red">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Number</Label>
              <Input id="phone" placeholder="9876543210" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-brand-red">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="line1">Address Line 1</Label>
              <Input id="line1" placeholder="House/Flat No, Street" {...register("line1")} />
              {errors.line1 && (
                <p className="text-xs text-brand-red">{errors.line1.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line2">Address Line 2 (optional)</Label>
            <Input id="line2" placeholder="Apartment, Locality" {...register("line2")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" {...register("city")} />
              {errors.city && (
                <p className="text-xs text-brand-red">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="State" {...register("state")} />
              {errors.state && (
                <p className="text-xs text-brand-red">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" placeholder="6-digit pincode" {...register("pincode")} />
              {errors.pincode && (
                <p className="text-xs text-brand-red">{errors.pincode.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              {...register("isDefault")}
              className="size-4 rounded border-border text-bronze focus:ring-bronze"
            />
            <Label htmlFor="isDefault" className="font-normal cursor-pointer select-none">
              Make this my default delivery address
            </Label>
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-brand-red">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {isSubmitting ? "Saving..." : editingId ? "Update Address" : "Save Address"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleCancel}
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center rounded-2xl bg-cream p-10 border border-dashed border-linen/80">
            <Home className="mx-auto text-graphite/30 mb-3" size={32} />
            <p className="text-sm text-graphite/60">
              No saved addresses yet. Add one to speed up checkout.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative rounded-2xl bg-cream p-6 border transition-all ${
                  addr.isDefault
                    ? "border-bronze shadow-xs"
                    : "border-linen/70 hover:border-linen"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 text-sm leading-relaxed text-graphite/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-charcoal text-base">
                        {addr.name}
                      </span>
                      {addr.label && (
                        <span className="bg-bronze/10 text-bronze text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {addr.label}
                        </span>
                      )}
                      {addr.isDefault && (
                        <span className="bg-emerald-500/10 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-charcoal font-medium">{addr.phone}</p>
                    <p>
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}
                    </p>
                    <p>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {!addr.isDefault && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={settingDefaultId !== null}
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs h-8"
                      >
                        {settingDefaultId === addr.id ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : (
                          "Set default"
                        )}
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(addr)}
                      disabled={deletingId !== null}
                      title="Edit address"
                      className="p-2 text-graphite/50 hover:text-bronze hover:bg-ivory rounded-full transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId !== null}
                      title="Delete address"
                      className="p-2 text-graphite/50 hover:text-brand-red hover:bg-ivory rounded-full transition-colors"
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
