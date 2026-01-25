import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface KPIResult {
    key: string;
    label: string;
    description: string;
    formula_pretty: string;
    formula_str?: string;  // Simple text formula like "(recycled / total_waste) * 100"
    substitution_pretty: string;
    result: number;
    unit: string;
    status?: string;
}

interface KPIBlockProps {
    kpis: KPIResult[];
    title?: string;
}

export const KPIBlock: React.FC<KPIBlockProps> = ({ kpis, title = "Verified KPI Calculations" }) => {
    if (!kpis || kpis.length === 0) return null;

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Good': return 'border-l-green-500';
            case 'Warning': return 'border-l-yellow-500';
            case 'Critical': return 'border-l-red-500';
            default: return 'border-l-blue-500';
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'Good': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Good</span>;
            case 'Warning': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Warning</span>;
            case 'Critical': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Critical</span>;
            default: return null;
        }
    };

    return (
        <div className="my-8 space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                    Verified Python Calculation
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {kpis.map((kpi) => (
                    <Card key={kpi.key} className={`overflow-hidden border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow ${getStatusColor(kpi.status)}`}>
                        <CardHeader className="pb-2 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800">{kpi.label}</CardTitle>
                                    <div className="flex gap-2 items-center mt-1">
                                        <p className="text-sm text-slate-500">{kpi.description}</p>
                                        {getStatusBadge(kpi.status)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                                    {kpi.result}{kpi.unit}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Formula</span>
                                {kpi.formula_str && (
                                    <div className="bg-blue-50 text-blue-900 p-3 rounded-md font-mono text-sm overflow-x-auto border border-blue-200">
                                        <code>{kpi.formula_str}</code>
                                    </div>
                                )}
                                <span className="text-xs text-slate-400">SymPy Representation</span>
                                <div className="bg-slate-900 text-slate-50 p-3 rounded-md font-mono text-sm overflow-x-auto">
                                    <pre>{kpi.formula_pretty}</pre>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification Steps</span>
                                <div className="bg-slate-100 text-slate-700 p-3 rounded-md font-mono text-sm overflow-x-auto border border-slate-200">
                                    <pre>{kpi.substitution_pretty} = {kpi.result}{kpi.unit}</pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
