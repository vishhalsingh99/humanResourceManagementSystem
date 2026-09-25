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
    <div className={isOnboarding ? 'min-h-screen bg-[var(--bg-panel)] p-5 sm:p-8' : 'mt-18 p-4 sm:p-6 lg:p-8'}>
      <div className="mx-auto max-w-7xl rounded-2xl border t-border bg-[var(--bg-surface)] p-6 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
        {isOnboarding && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 cursor-pointer rounded-xl border border-[var(--border-base)] bg-[var(--bg-input)] px-4 py-2.5 text-sm font-semibold t-text-secondary transition hover:border-red-500/40 hover:bg-red-500/10"
          >
            ← Back
          </button>
        )}
        <form onSubmit={handleSubmit}>
          <div>
            <h1 className="text-2xl font-bold t-text-heading">Choose Subscription Plan</h1>
            <p className="mt-3 text-sm t-text-muted">Admin must read and check the selected plan rules before activating the plan.</p>
          </div>

          <div className="mt-7">
            <h2 className="text-lg font-bold t-text-heading">Available Plans</h2>
            <p className="mt-3 text-sm t-text-muted">Pick the subscription that fits your billing and reporting needs.</p>

            <div className="mt-7 grid gap-6 border-t t-divider pt-5 lg:grid-cols-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const selected = selectedPlan === plan.id;

                return (
                  <article
                    key={plan.id}
                    className={`flex min-h-103.75 flex-col rounded-xl border p-6 text-left transition ${selected ? 'border-red-500/60 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-[var(--border-base)] bg-[var(--bg-input)] hover:border-red-500/30'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-bold t-text-heading">{plan.name}</h3>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${selected
                          ? 'bg-red-500 text-white'
                          : 'bg-[var(--bg-badge-neutral)] text-[var(--text-badge)]'
                          }`}
                      >
                        {selected ? 'SELECTED' : 'AVAILABLE'}
                      </span>
                    </div>

                    <p className="mt-5 min-h-18 text-sm leading-6 t-text-muted">{plan.desc}</p>
                    <p className="mt-6 text-3xl font-extrabold t-text-heading">{plan.price}</p>

                    <div className="mt-6 rounded-xl border t-border bg-[var(--bg-input)] px-4 py-3 text-sm font-semibold t-text-heading">
                      Employee limit: {plan.employeeLimit ? `${plan.employeeLimit} employees` : 'Unlimited employees'}
                    </div>

                    <ol className="mt-5 flex flex-1 list-decimal flex-col gap-2 pl-5 text-sm leading-5 t-text-muted">
                      {plan.rules.slice(0, 2).map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ol>

                    <div className="mt-6 grid gap-3">
                      <button
                        type="button"
                        onClick={() => openRulesPopup(plan)}
                        className="cursor-pointer rounded-xl border border-[var(--border-base)] bg-[var(--bg-input)] px-4 py-2.5 text-sm font-semibold t-text-secondary transition hover:border-red-500/40 hover:text-red-300"
                      >
                        Read more...
                      </button>
                      {/* button done  */}
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${selected
                          ? 'border-red-500/60 bg-red-500/10 text-red-300'
                          : 'border-[var(--border-base)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-red-500/40 hover:text-red-300'
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

          <div className="mt-8 flex justify-end border-t t-divider pt-5">
            <button
              type="submit"
              disabled={isSaving}
              className="cursor-pointer rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Creating Database...' : isOnboarding ? 'Save & Continue' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>

      {rulesPlan && (
        <div className="fixed inset-0 z-50 mt-18 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border t-border bg-[var(--bg-panel)] shadow-[0_0_28px_rgba(239,68,68,0.15)]">
            <div className="flex items-start justify-between gap-4 border-b t-divider px-6 py-5">
              <div>
                <h2 className="text-xl font-bold t-text-heading">{rulesPlan.name} Plan Rules</h2>
                <p className="mt-2 text-sm t-text-muted">Read all rules, then check them to unlock this plan.</p>
              </div>
              <button
                type="button"
                onClick={closeRulesPopup}
                className="cursor-pointer rounded-xl border border-[var(--border-base)] bg-[var(--bg-input)] px-3 py-1.5 text-sm font-semibold t-text-secondary hover:border-[var(--text-subtle)]"
              >
                Close
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
              <div className="rounded-xl border t-border bg-[var(--bg-input)] px-4 py-3 text-sm font-semibold t-text-heading">
                Employee limit: {rulesPlan.employeeLimit ? `${rulesPlan.employeeLimit} employees` : 'Unlimited employees'}
              </div>

              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 t-text-muted">
                {rulesPlan.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>


            </div>

            <div className="flex justify-end gap-3 border-t t-divider px-6 py-5">
              <button
                type="button"
                onClick={closeRulesPopup}
                className="cursor-pointer rounded-xl border border-[var(--border-base)] bg-[var(--bg-input)] px-4 py-2.5 text-sm font-semibold t-text-secondary hover:border-[var(--text-subtle)]"
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