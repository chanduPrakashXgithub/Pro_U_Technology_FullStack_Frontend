const Input = ({ label, className = '', ...props }) => (
    <div className="input-group">
        {label && <label>{label}</label>}
        <input className={`input ${className}`} {...props} />
    </div>
);

export default Input;