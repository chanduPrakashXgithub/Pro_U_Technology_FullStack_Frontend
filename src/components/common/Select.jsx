const Select = ({ label, options, className = '', ...props }) => (
    <div className="select-group">
        {label && <label>{label}</label>}
        <select className={`select ${className}`} {...props}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

export default Select;