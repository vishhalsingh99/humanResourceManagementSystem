import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../constants/routes.constants';
import { getSubscriptionPlan, SUBSCRIPTION_PLANS } from '../../constants/subscription.constants';

function Subscription({ mode = 'settings' }) {
  const navigate = useNavigate();
  const { onboarding, completeTenantOnboarding, updateSubscriptionOnboarding, showToast } = useApp();
  const isOnboarding = mode === 'onboarding';
  const initialPlanId = getSubscriptionPlan(onboarding.subscription).id;
  const [selectedPlan, setSelectedPlan] = useState(initialPlanId);

  const [rulesPlan, setRulesPlan] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  const openRulesPopup = (plan) => {
    setRulesPlan(plan);
    setTermsAccepted(false);
  };

  const closeRulesPopup = () => {
    setRulesPlan(null);
    setTermsAccepted(false);
  };

  const handleCheckRules = () => {
    if (!rulesPlan) return;

    if (!termsAccepted) {
      showToast('Please agree to the Subscription Terms & Usage Policy', 'error');
      return;
    }


  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan.id);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedPlan) {
      showToast('Please select a plan', 'error');
      return;
    }

    if (isOnboarding) {
      try {
        setIsSaving(true);
        await completeTenantOnboarding(selectedPlan);
        showToast('Company database created and onboarding completed', 'success');
        navigate(ROUTES.DASHBOARD);
      } catch (error) {
        showToast(error.response?.data?.error || 'Unable to complete onboarding', 'error');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      setIsSaving(true);
      await updateSubscriptionOnboarding(selectedPlan);
      showToast('Subscription plan updated', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to update subscription plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.ONBOARDING_COMPANY);
  };

  return (
    <div className={isOnboarding ? 'min-h-screen bg-white p-5 sm:p-8' : ' mt-18 p-4 sm:p-6 lg:p-8'}>
      <div className="mx-auto max-w-7xl bg-white p-6">
        {isOnboarding && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 rounded border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            ← Back
          </button>
        )}
        <form onSubmit={handleSubmit}>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Choose Subscription Plan</h1>
            <p className="mt-3 text-sm text-slate-700">Admin must read and check the selected plan rules before activating the plan.</p>
          </div>

          <div className="mt-7">
            <h2 className="text-lg font-bold text-slate-950">Available Plans</h2>
            <p className="mt-3 text-sm text-slate-700">Pick the subscription that fits your billing and reporting needs.</p>

            <div className="mt-7 grid gap-6 border-t border-slate-200 pt-5 lg:grid-cols-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const selected = selectedPlan === plan.id;
                const checked = true;

                return (
                  <article
                    key={plan.id}
                    className={`flex min-h-103.75 flex-col rounded border p-6 text-left transition ${selected ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_1px_rgba(37,99,235,0.5)]' : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-bold text-slate-950">{plan.name}</h3>
                      <span
                        className={`rounded px-3 py-1.5 text-xs font-bold ${selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                          }`}
                      >
                        {selected ? 'SELECTED' : 'AVAILABLE'}
                      </span>
                    </div>

                    <p className="mt-5 min-h-18 text-sm leading-6 text-slate-700">{plan.desc}</p>
                    <p className="mt-6 text-3xl font-extrabold text-slate-950">{plan.price}</p>

                    <div className="mt-6 rounded border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                      Employee limit: {plan.employeeLimit ? `${plan.employeeLimit} employees` : 'Unlimited employees'}
                    </div>

                    <ol className="mt-5 flex flex-1 list-decimal flex-col gap-2 pl-5 text-sm leading-5 text-slate-700">
                      {plan.rules.slice(0, 2).map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ol>

                    <div className="mt-6 grid gap-3">
                      <button
                        type="button"
                        onClick={() => openRulesPopup(plan)}
                        className="rounded border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        Read more...
                      </button>
                      {/* button done  */}
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        className={`rounded border px-4 py-2.5 text-sm font-semibold cursor-pointer transition ${selected
                          ? 'border-blue-600 bg-blue-50 cursor-pointer text-blue-700'
                          : 'border-slate-300 bg-white text-slate-700 cursor-pointer hover:border-blue-300 hover:text-blue-700'
                          }`}
                      >
                        {selected ? 'Selected Plan' : 'Select Plan'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-slate-300"
            >
              {isSaving ? 'Creating Database...' : isOnboarding ? 'Save & Continue' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>

      {rulesPlan && (
        <div className="fixed inset-0 z-50 mt-18 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{rulesPlan.name} Plan Rules</h2>
                <p className="mt-2 text-sm text-slate-600">Read all rules, then check them to unlock this plan.</p>
              </div>
              <button
                type="button"
                onClick={closeRulesPopup}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                Close
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
              <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                Employee limit: {rulesPlan.employeeLimit ? `${rulesPlan.employeeLimit} employees` : 'Unlimited employees'}
              </div>

              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
                {rulesPlan.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>


            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={closeRulesPopup}
                className="rounded border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscription;
