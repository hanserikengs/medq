'use client'

export default function TermsText() {
  return (
    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <p><strong>1. Personuppgifter vi sparar</strong><br/>
          För att du ska kunna använda MedQ sparar vi din e-postadress, ditt visningsnamn och ditt lösenord (krypterat). Vi sparar även historik över vilka frågor du svarat på och ditt resultat för att kunna visa din statistik.</p>

          <p><strong>2. Syfte</strong><br/>
          Syftet är enbart att tillhandahålla studietjänsten MedQ. Datan används inte för något annat än att låta dig få statistik över hur studierna går, att kunna driva funktionaliteten på hemsidan. Datan lämnas inte ut till tredje part.</p>

          <p><strong>3. Tjänstens leverantör</strong><br/>
          Data lagras säkert hos Supabase (tjänsteleverantör). Ansvarig för appen är jag själv, Erik Engström (Student, KI).</p>

          <p><strong>4. Dina rättigheter (GDPR)</strong><br/>
          Du har rätt att när som helst begära utdrag av din data eller begära att ditt konto och all historik raderas. Du kan alltid radera ditt konto och din statistik via inställningarna på hemskärmen alternativt kontakta erik.engstrom@stud.ki.se för detta.</p>

          <p><strong>5. Ansvarsfriskrivning</strong><br/>
          MedQ är ett studieredskap skapat av mig, Erik Engström, som studiemedel med hjälp av gamla tentafrågor samt urval av frågor från föreläsningar, seminarium och liknande. Frågor och förklaringar kan innehålla felaktigheter (vissa är AI-genererade). Tjänsten ska inte användas som medicinskt beslutsunderlag.</p>
      </div>
  );
}