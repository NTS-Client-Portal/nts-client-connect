import React, { useState, useEffect } from 'react';

const OrderTandA = () => {
    const [isAgreed, setIsAgreed] = useState(false);
    return (
        <div className="mt-4 border border-zinc-900 pt-4 max-h-80 p-8 overflow-y-auto">
            <p>
                Customer-provided load descriptions and dimensions must be accurate, loading areas and pathways must be accessible to the carrier, and any unusual conditions on-site on pickup and delivery must be advised in advance. Failure to adequately describe and report the above information or give advance notice of special conditions will incur additional charges or truck cancellation fees.
            </p>
            <p>
                Transport costs are payable by bank wire, ACH, bank transfer, credit card, cash, and certified funds. All payment arrangements have been made with your account representative and paid for in full prior to pickup unless other arrangements have been made. If payment is made in full by credit card, a 3% service fee will be applied. The total cost includes all fees (taxes, insurance, and fuel surcharges that otherwise would apply).
            </p>

            <p>
                Carrier insurance limits are $100,000 unless stated otherwise in writing, or additional certificates or trip riders are provided. By my signature affixed to this agreement, I hereby agree as the customer accepting the transporter&apos;s service and the broker Nationwide Transport Services (N.T.S) to pay all charges as agreed. I understand that any deposit is 100% refundable until 72 hours before my 1st available pickup date, which thereafter will be surrendered. Any cancellation must be submitted to N.T.S. via Fax or Email. I understand that the broker is not the actual transporter of my shipment and that as the broker, N.T.S. will obtain the services of a qualified carrier with the ability and qualifications to move and deliver my shipment.
            </p>

            <p>
                I further understand that while every effort will be made to obtain a driver on a timely basis, the broker cannot guarantee and will not act as a guarantor of the transporter&apos;s actions. We also do not guarantee any specific delivery dates due to variables such as weather and unforeseeable events. Each transporter is an independently owned entity and is not related to the broker in any way. I agree by signature hereon that the broker cannot be held responsible for any act of negligence of the carrier or any act of God or force of nature.
            </p>

            <p>
                Inspection of your shipment must be done on delivery and before signing the Bill of Lading (delivery inspection report). If there are any new damages, they must be recorded on the Bill of Lading to proceed with a claim. If you cannot inspect due to special conditions such as deliveries at night, snow, rain, dirty vehicles, etc., please mark that you cannot inspect due to these conditions on the Bill of Lading. The customer must keep a copy of the signed BOL with damages noted thereon. For vehicle shipments, the customer is responsible for removing electronic toll collectors ahead of time, like SunPass/ EZ-Pass, to avoid being charged passing tolls while in transport.
            </p>

            <p>
                I understand this agreement is of no force and effect until my signature is affixed hereto unless I allow an authorized carrier to pick up my shipment, where then I will be bound by all the terms and conditions contained herein. By my signature affixed to this agreement, I hereby agree to accept the services of N.T.S and the transporter selected by N.T.S.
            </p>


            <div className="flex items-center mt-2">
                <input
                    type="checkbox"
                    id="agree"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mr-2 size-4"
                    required
                />
                <label htmlFor="agree" className="text-base font-semibold">I agree to the terms and conditions</label>
            </div>
        </div>
    );
}