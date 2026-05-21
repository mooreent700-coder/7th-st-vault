'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

type SubmitState = 'idle' | 'loading' | 'error' | 'success';
type CustomerType = 'shopper' | 'creator' | 'collector';

const FASHION_HERO_IMAGE =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=90&w=1800&auto=format&fit=crop';

const STYLE_CARDS = [
  { title: 'Streetwear', text: 'Find drops, outfits, sellers, and videos from real fashion brands.' },
  { title: 'Luxury', text: 'Save premium pieces, jewelry, denim, sneakers, and accessories.' },
  { title: 'Kids Fashion', text: 'Shop boys, girls, infant, newborn, and family fashion collections.' },
];

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, '').trim();
}

function displayError(error: unknown) {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || 'Something went wrong. Please try again.');
  return 'Something went wrong. Please try again.';
}

export default function CustomerSignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('shopper');
  const [styleInterest, setStyleInterest] = useState('Streetwear');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(() => {
    return Boolean(name.trim() && email.trim() && password.length >= 6 && confirmPassword.length >= 6 && acceptTerms && submitState !== 'loading');
  }, [acceptTerms, confirmPassword, email, name, password, submitState]);

  async function upsertCustomerProfile(userId: string) {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhoneNumber = cleanPhone(phone);

    await supabase.from('customer_profiles').upsert(
      {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhoneNumber || null,
        customer_type: customerType,
        style_interest: styleInterest,
        platform: '7th St Vault',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setSubmitState('error');
      setMessage('Enter your name to create your customer account.');
      return;
    }

    if (!cleanEmail.includes('@')) {
      setSubmitState('error');
      setMessage('Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setSubmitState('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitState('error');
      setMessage('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      setSubmitState('error');
      setMessage('Accept the customer terms to continue.');
      return;
    }

    setSubmitState('loading');

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          phone: cleanPhone(phone),
          role: 'customer',
          customer_type: customerType,
          style_interest: styleInterest,
          platform: '7th St Vault',
        },
      },
    });

    if (error) {
      setSubmitState('error');
      setMessage(displayError(error));
      return;
    }

    if (data.user?.id) {
      await upsertCustomerProfile(data.user.id);
    }

    setSubmitState('success');
    setMessage('Your 7th St Vault customer account is ready.');
    window.setTimeout(() => router.push('/customer'), 650);
  }

  return (
    <main className="signupPage">
      <section className="heroPanel" aria-label="7th St Vault customer signup">
        <div className="heroImage" />
        <div className="heroShade" />

        <nav className="topNav">
          <Link href="/" className="brandMark" aria-label="7th St Vault home">
            <span>7SV</span>
            <b>7th St Vault</b>
          </Link>

          <div className="navActions">
            <Link href="/discover">Discover</Link>
            <Link href="/customer/login">Log In</Link>
          </div>
        </nav>

        <div className="heroCopy">
          <div className="eyebrow">CUSTOMER ACCOUNT</div>
          <h1>Shop fashion drops from real sellers.</h1>
          <p>Create your free customer account to save outfits, follow fashion brands, watch product videos, and shop directly from 7th St Vault sellers.</p>

          <div className="statsRow">
            <span>Streetwear</span>
            <span>Sneakers</span>
            <span>Jewelry</span>
            <span>Kids</span>
          </div>
        </div>
      </section>

      <section className="formPanel">
        <div className="formCard">
          <div className="formHeader">
            <p>FREE CUSTOMER SIGN UP</p>
            <h2>Create your account</h2>
            <span>Find brands, save favorites, and track your fashion orders.</span>
          </div>

          <form onSubmit={handleSubmit} className="signupForm">
            <label>
              Full Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" />
            </label>

            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" type="email" autoComplete="email" />
            </label>

            <label>
              Phone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional phone number" type="tel" autoComplete="tel" />
            </label>

            <div className="passwordGrid">
              <label>
                Password
                <div className="passwordField">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <label>
                Confirm Password
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                />
              </label>
            </div>

            <div className="optionBlock">
              <span>How will you use 7th St Vault?</span>
              <div className="optionGrid">
                {[
                  ['shopper', 'Shopper'],
                  ['creator', 'Style Creator'],
                  ['collector', 'Collector'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={customerType === value ? 'option active' : 'option'}
                    onClick={() => setCustomerType(value as CustomerType)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label>
              Main Style Interest
              <select value={styleInterest} onChange={(event) => setStyleInterest(event.target.value)}>
                <option>Streetwear</option>
                <option>Luxury</option>
                <option>Sneakers</option>
                <option>Denim</option>
                <option>Jewelry</option>
                <option>Accessories</option>
                <option>Women</option>
                <option>Men</option>
                <option>Kids</option>
                <option>Newborn</option>
                <option>Vintage</option>
              </select>
            </label>

            <label className="termsRow">
              <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
              <span>I agree to use 7th St Vault for fashion shopping, saving brands, posting appropriate fashion content, and following platform rules.</span>
            </label>

            {message ? <div className={`message ${submitState}`}>{message}</div> : null}

            <button type="submit" className="submitButton" disabled={!canSubmit}>
              {submitState === 'loading' ? 'Creating account...' : 'Create Free Customer Account'}
            </button>
          </form>

          <div className="loginLine">
            Already have an account? <Link href="/customer/login">Log in</Link>
          </div>
        </div>

        <div className="previewStack">
          {STYLE_CARDS.map((card) => (
            <article key={card.title}>
              <b>{card.title}</b>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx global>{`
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;background:#02040a;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        a{text-decoration:none;color:inherit}
        button,input,select{font:inherit}
        .signupPage{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,560px);background:radial-gradient(circle at 80% 0%,rgba(45,108,255,.22),transparent 38%),#02040a}
        .heroPanel{position:relative;min-height:100vh;overflow:hidden;padding:30px;display:flex;flex-direction:column;justify-content:space-between}
        .heroImage{position:absolute;inset:0;background-image:url('${FASHION_HERO_IMAGE}');background-size:cover;background-position:center;filter:saturate(1.04) contrast(1.05)}
        .heroShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,4,10,.92),rgba(2,4,10,.62),rgba(2,4,10,.18)),linear-gradient(0deg,rgba(2,4,10,.88),transparent 55%)}
        .topNav,.heroCopy{position:relative;z-index:2}
        .topNav{display:flex;align-items:center;justify-content:space-between;gap:18px}
        .brandMark{display:flex;align-items:center;gap:12px}
        .brandMark span{width:58px;height:58px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,#1b63ff,#003baf);border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 45px rgba(27,99,255,.28);font-weight:1000}
        .brandMark b{text-transform:uppercase;letter-spacing:.12em;font-size:13px}
        .navActions{display:flex;gap:10px;align-items:center}
        .navActions a{height:44px;padding:0 16px;border-radius:999px;display:flex;align-items:center;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);font-weight:900}
        .heroCopy{max-width:760px;padding-bottom:64px}
        .eyebrow{width:max-content;border-radius:999px;background:rgba(27,99,255,.18);border:1px solid rgba(72,140,255,.38);color:#68a0ff;padding:9px 14px;font-weight:1000;letter-spacing:.16em;font-size:12px}
        .heroCopy h1{margin:18px 0 12px;font-size:clamp(52px,7vw,104px);line-height:.88;letter-spacing:-.08em;text-transform:uppercase}
        .heroCopy p{max-width:620px;margin:0;color:rgba(255,255,255,.78);font-size:19px;line-height:1.45;font-weight:700}
        .statsRow{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
        .statsRow span{border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);padding:10px 14px;font-weight:1000}
        .formPanel{min-height:100vh;padding:28px;display:flex;flex-direction:column;justify-content:center;gap:16px;background:linear-gradient(180deg,rgba(6,10,20,.94),rgba(3,5,12,.98));border-left:1px solid rgba(255,255,255,.1)}
        .formCard{border-radius:34px;background:rgba(255,255,255,.96);color:#07111f;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.38)}
        .formHeader p{margin:0 0 8px;color:#1b63ff;font-size:12px;font-weight:1000;letter-spacing:.16em}
        .formHeader h2{margin:0;font-size:38px;line-height:1;letter-spacing:-.05em}
        .formHeader span{display:block;margin-top:8px;color:#5b6472;font-weight:800}
        .signupForm{display:grid;gap:14px;margin-top:22px}
        label{display:grid;gap:7px;font-size:13px;font-weight:1000;color:#162033}
        input,select{width:100%;height:52px;border-radius:17px;border:1px solid rgba(7,17,31,.16);background:#f8fafc;color:#07111f;padding:0 15px;outline:none;font-weight:900}
        select{appearance:none}
        input:focus,select:focus{border-color:#1b63ff;box-shadow:0 0 0 4px rgba(27,99,255,.12)}
        .passwordGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .passwordField{display:flex;align-items:center;gap:8px;height:52px;border-radius:17px;border:1px solid rgba(7,17,31,.16);background:#f8fafc;padding:0 8px 0 0}
        .passwordField input{border:0;box-shadow:none;background:transparent}
        .passwordField button{height:38px;border:0;border-radius:13px;background:#07111f;color:#fff;padding:0 12px;font-weight:1000;cursor:pointer}
        .optionBlock{display:grid;gap:9px}
        .optionBlock span{font-size:13px;font-weight:1000;color:#162033}
        .optionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .option{height:46px;border-radius:15px;border:1px solid rgba(7,17,31,.14);background:#f8fafc;color:#07111f;font-weight:1000;cursor:pointer}
        .option.active{background:#1b63ff;color:#fff;border-color:#1b63ff;box-shadow:0 14px 28px rgba(27,99,255,.22)}
        .termsRow{grid-template-columns:22px 1fr;align-items:start;gap:10px;color:#5b6472;line-height:1.35}
        .termsRow input{width:20px;height:20px;border-radius:6px;margin-top:1px}
        .message{border-radius:16px;padding:12px 14px;font-weight:900}
        .message.error{background:#fee2e2;color:#991b1b}
        .message.success{background:#dcfce7;color:#166534}
        .submitButton{height:58px;border:0;border-radius:18px;background:linear-gradient(135deg,#1b63ff,#003baf);color:#fff;font-weight:1000;cursor:pointer;box-shadow:0 18px 38px rgba(27,99,255,.3)}
        .submitButton:disabled{opacity:.5;cursor:not-allowed}
        .loginLine{text-align:center;margin-top:16px;color:#5b6472;font-weight:900}
        .loginLine a{color:#1b63ff}
        .previewStack{display:grid;gap:10px}
        .previewStack article{border-radius:24px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.07);padding:18px}
        .previewStack b{display:block;font-size:18px}
        .previewStack p{margin:6px 0 0;color:rgba(255,255,255,.68);line-height:1.4;font-weight:700}
        @media(max-width:980px){.signupPage{grid-template-columns:1fr}.heroPanel{min-height:540px}.formPanel{min-height:auto;border-left:0}.heroCopy{padding-bottom:20px}}
        @media(max-width:640px){.heroPanel,.formPanel{padding:16px}.topNav{align-items:flex-start}.navActions{flex-direction:column;align-items:stretch}.heroCopy h1{font-size:54px}.formCard{padding:20px;border-radius:26px}.passwordGrid,.optionGrid{grid-template-columns:1fr}.formHeader h2{font-size:32px}}
      `}</style>
    </main>
  );
}
