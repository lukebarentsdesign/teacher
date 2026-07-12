"use client";

import { useActionState, useTransition } from "react";
import { addAddOnBookingAction, removeAddOnBookingAction } from "./actions";

type AddOnOption = { id: string; name: string; price: string; chargeUnit: string };
type Booking = { id: string; quantity: number; priceAtTime: string; addOn: { name: string } };

export function AddOnBookings({
  lessonId,
  addOns,
  bookings,
}: {
  lessonId: string;
  addOns: AddOnOption[];
  bookings: Booking[];
}) {
  const [error, action, pending] = useActionState(addAddOnBookingAction.bind(null, lessonId), undefined);
  const [removing, startRemove] = useTransition();

  return (
    <div className="space-y-3">
      {bookings.length > 0 && (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-neutral-800">
                {booking.addOn.name} × {booking.quantity}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-neutral-500">£{booking.priceAtTime}</span>
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => startRemove(() => removeAddOnBookingAction(lessonId, booking.id))}
                  className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {addOns.length === 0 ? (
        <p className="text-xs text-neutral-400">
          No add-ons configured yet — add some under Add-ons in Setup.
        </p>
      ) : (
        <form action={action} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="addOnId" className="block text-xs font-medium text-neutral-700">
              Add-on
            </label>
            <select
              id="addOnId"
              name="addOnId"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            >
              {addOns.map((addOn) => (
                <option key={addOn.id} value={addOn.id}>
                  {addOn.name} — £{addOn.price}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label htmlFor="quantity" className="block text-xs font-medium text-neutral-700">
              Qty
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
