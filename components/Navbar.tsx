export default function Navbar() {
    return (
        <nav className="navbar">
            <a href="/" className="logo">
                NOPI <span style={{ color: 'var(--color-primary)' }}>Shoe-Doctor</span>
            </a>
            <div className="nav-links">
                <a href="#features">기능 소개</a>
                <a href="#analyze">분석하기</a>
                <a href="#shop">추천 제품</a>
            </div>
        </nav>
    );
}
