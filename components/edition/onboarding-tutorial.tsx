"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Mic,
  MessageSquare,
  FileText,
  Palette,
  Users,
  Sparkles,
  X,
  Plus,
  Minus,
  Download,
  Receipt,
  PenLine,
  Trash2,
} from "lucide-react";

const MAX_AVATAR_URL =
  "https://ckvcijpgohqlnvoinwmc.supabase.co/storage/v1/object/public/buildify-assets/Logo/Agent%20IA.png";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
  targetId?: string;
  quoteOnly?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bienvenue dans votre espace !",
    description:
      "Je suis Max, votre assistant intelligent. Je vais vous guider à travers les fonctionnalités de l'éditeur.",
    icon: <Sparkles className="w-5 h-5" />,
    tip: "Conseil : Vous pouvez toujours me poser des questions !",
  },
  {
    id: "voice",
    title: "Parlez-moi, je vous écoute !",
    description:
      "Utilisez ce bouton micro pour me dicter votre devis. Décrivez les travaux, quantités et prix.",
    icon: <Mic className="w-5 h-5" />,
    tip: 'Exemple : "Pose de carrelage 20m² à 45€/m²"',
    targetId: "tour-mic-button",
  },
  {
    id: "chat",
    title: "Discutez avec moi",
    description:
      "Préférez taper ? Utilisez cette zone pour me décrire votre devis ou demander des modifications.",
    icon: <MessageSquare className="w-5 h-5" />,
    tip: 'Essayez : "Ajoute une ligne pour les matériaux"',
    targetId: "tour-chat-input",
  },
  {
    id: "document",
    title: "Votre document en temps réel",
    description:
      "Cliquez directement sur n'importe quel texte du document pour le modifier. Nom, adresse, prix... tout est éditable !",
    icon: <FileText className="w-5 h-5" />,
    tip: "Les modifications sont sauvegardées automatiquement",
    targetId: "tour-document-preview",
  },
  {
    id: "add-line",
    title: "Ajouter une ligne",
    description:
      "Besoin d'une nouvelle prestation ? Ce bouton ajoute une ligne vide à votre document.",
    icon: <Plus className="w-5 h-5" />,
    tip: "Vous pouvez aussi demander à Max d'ajouter des lignes",
    targetId: "tour-add-line-button",
  },
  {
    id: "remove-line",
    title: "Supprimer des lignes",
    description:
      "Activez ce mode pour sélectionner et supprimer une ou plusieurs lignes de votre document.",
    icon: <Minus className="w-5 h-5" />,
    tip: "Cliquez sur les lignes à supprimer puis confirmez",
    targetId: "tour-remove-line-button",
  },
  {
    id: "download",
    title: "Télécharger en PDF",
    description:
      "Exportez votre document au format PDF pour l'envoyer à vos clients ou l'imprimer.",
    icon: <Download className="w-5 h-5" />,
    tip: "Le PDF reprend votre logo et couleur d'accent",
    targetId: "tour-download-button",
  },
  {
    id: "customize",
    title: "Personnalisez votre style",
    description:
      "Changez la couleur d'accent de votre document avec cette palette pour un rendu unique.",
    icon: <Palette className="w-5 h-5" />,
    tip: "Votre logo apparaît automatiquement",
    targetId: "tour-color-button",
  },
  {
    id: "clients",
    title: "Fiche client",
    description:
      "Accédez à la fiche du client pour voir ses informations et l'historique de ses documents.",
    icon: <Users className="w-5 h-5" />,
    tip: "Retrouvez facilement tous les documents d'un client",
    targetId: "tour-client-button",
  },
  {
    id: "convert",
    title: "Transformer en facture",
    description:
      "Une fois le devis accepté, convertissez-le en facture en un clic. Le devis original est conservé.",
    icon: <Receipt className="w-5 h-5" />,
    tip: "La facture reprend toutes les informations du devis",
    targetId: "tour-convert-button",
    quoteOnly: true,
  },
  {
    id: "signature",
    title: "Signature électronique",
    description:
      "Faites signer le devis directement sur l'écran. La signature apparaîtra sur le PDF.",
    icon: <PenLine className="w-5 h-5" />,
    tip: "Idéal pour une validation rapide sur tablette",
    targetId: "tour-signature-button",
    quoteOnly: true,
  },
  {
    id: "delete",
    title: "Supprimer le document",
    description:
      "Ce bouton supprime définitivement le document. Cette action est irréversible.",
    icon: <Trash2 className="w-5 h-5" />,
    tip: "Une confirmation vous sera demandée",
    targetId: "tour-delete-button",
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface OnboardingTutorialProps {
  onComplete: () => void;
  documentType?: "quote" | "invoice";
}

const GAP = 12;
const MARGIN = 12;

export function OnboardingTutorial({
  onComplete,
  documentType = "quote",
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [computedPosition, setComputedPosition] =
    useState<TooltipPosition | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(360);
  const rafRef = useRef<number>(0);

  const filteredSteps = tutorialSteps.filter((s) => {
    if (s.quoteOnly && documentType === "invoice") return false;
    return true;
  });
  const step = filteredSteps[currentStep];
  const isLastStep = currentStep === filteredSteps.length - 1;
  const hasTarget = !!step?.targetId;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 400) {
        setTooltipWidth(width - MARGIN * 2);
      } else if (width < 640) {
        setTooltipWidth(320);
      } else {
        setTooltipWidth(360);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const tooltipHeight = 280;

    const updatePosition = () => {
      if (!step?.targetId) {
        setTargetRect(null);
        setComputedPosition(null);
        rafRef.current = requestAnimationFrame(updatePosition);
        return;
      }

      const element = document.querySelector(
        `[data-tour-id="${step.targetId}"]`,
      );
      if (element) {
        const rect = element.getBoundingClientRect();
        const newRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        setTargetRect((prev) => {
          if (
            prev &&
            prev.top === newRect.top &&
            prev.left === newRect.left &&
            prev.width === newRect.width &&
            prev.height === newRect.height
          ) {
            return prev;
          }
          return newRect;
        });

        const spaceTop = rect.top - MARGIN;
        const spaceBottom = window.innerHeight - rect.bottom - MARGIN;
        const spaceLeft = rect.left - MARGIN;
        const spaceRight = window.innerWidth - rect.right - MARGIN;

        let bestPosition: TooltipPosition = "bottom";

        if (spaceBottom >= tooltipHeight + GAP) {
          bestPosition = "bottom";
        } else if (spaceTop >= tooltipHeight + GAP) {
          bestPosition = "top";
        } else if (spaceRight >= tooltipWidth + GAP) {
          bestPosition = "right";
        } else if (spaceLeft >= tooltipWidth + GAP) {
          bestPosition = "left";
        } else {
          bestPosition = "bottom";
        }

        setComputedPosition(bestPosition);
      } else {
        setTargetRect(null);
        setComputedPosition(null);
      }

      rafRef.current = requestAnimationFrame(updatePosition);
    };

    rafRef.current = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [step?.targetId, tooltipWidth]);

  useEffect(() => {
    if (filteredSteps.length === 0) {
      onComplete();
    }
  }, [filteredSteps.length, onComplete]);

  if (!step) {
    return null;
  }

  function handleNext() {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handleSkip() {
    handleComplete();
  }

  function handleComplete() {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem("buildify_tutorial_completed", "true");
      onComplete();
    }, 300);
  }

  const getTooltipStyle = (): React.CSSProperties => {
    const tooltipHeight = 280;

    if (!targetRect || !computedPosition) {
      return {
        width: tooltipWidth,
        maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
      };
    }

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    let tooltipLeft = Math.max(
      MARGIN,
      Math.min(
        targetCenterX - tooltipWidth / 2,
        window.innerWidth - tooltipWidth - MARGIN,
      ),
    );

    let tooltipTop: number;

    switch (computedPosition) {
      case "bottom":
        tooltipTop = targetRect.top + targetRect.height + GAP;
        break;
      case "top":
        tooltipTop = targetRect.top - tooltipHeight - GAP;
        if (tooltipTop < MARGIN) tooltipTop = MARGIN;
        break;
      case "right":
        tooltipLeft = targetRect.left + targetRect.width + GAP;
        if (tooltipLeft + tooltipWidth > window.innerWidth - MARGIN) {
          tooltipLeft = window.innerWidth - tooltipWidth - MARGIN;
        }
        tooltipTop = Math.max(
          MARGIN,
          Math.min(
            targetCenterY - tooltipHeight / 2,
            window.innerHeight - tooltipHeight - MARGIN,
          ),
        );
        break;
      case "left":
        tooltipLeft = targetRect.left - tooltipWidth - GAP;
        if (tooltipLeft < MARGIN) {
          tooltipLeft = MARGIN;
        }
        tooltipTop = Math.max(
          MARGIN,
          Math.min(
            targetCenterY - tooltipHeight / 2,
            window.innerHeight - tooltipHeight - MARGIN,
          ),
        );
        break;
      default:
        tooltipTop = targetRect.top + targetRect.height + GAP;
    }

    if (tooltipTop + tooltipHeight > window.innerHeight - MARGIN) {
      tooltipTop = window.innerHeight - tooltipHeight - MARGIN;
    }
    if (tooltipTop < MARGIN) {
      tooltipTop = MARGIN;
    }

    return {
      position: "fixed",
      top: tooltipTop,
      left: tooltipLeft,
      width: tooltipWidth,
      maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
    };
  };

  const getArrowStyle = (): React.CSSProperties | null => {
    const tooltipHeight = 280;

    if (!targetRect || !computedPosition) return null;

    const arrowSize = 10;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const tooltipStyle = getTooltipStyle();
    const tooltipLeft =
      typeof tooltipStyle.left === "number" ? tooltipStyle.left : 0;
    const tooltipTop =
      typeof tooltipStyle.top === "number" ? tooltipStyle.top : 0;

    switch (computedPosition) {
      case "bottom": {
        const arrowLeft = Math.max(
          20,
          Math.min(targetCenterX - tooltipLeft, tooltipWidth - 20),
        );
        return {
          position: "absolute",
          top: -arrowSize,
          left: arrowLeft,
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid white`,
        };
      }
      case "top": {
        const arrowLeft = Math.max(
          20,
          Math.min(targetCenterX - tooltipLeft, tooltipWidth - 20),
        );
        return {
          position: "absolute",
          bottom: -arrowSize,
          left: arrowLeft,
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid white`,
        };
      }
      case "right": {
        const arrowTop = Math.max(
          20,
          Math.min(targetCenterY - tooltipTop, tooltipHeight - 20),
        );
        return {
          position: "absolute",
          left: -arrowSize,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid white`,
        };
      }
      case "left": {
        const arrowTop = Math.max(
          20,
          Math.min(targetCenterY - tooltipTop, tooltipHeight - 20),
        );
        return {
          position: "absolute",
          right: -arrowSize,
          top: arrowTop,
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid white`,
        };
      }
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100]"
        >
          {hasTarget && targetRect ? (
            <>
              <div
                className="absolute inset-0 bg-black/70"
                onClick={handleSkip}
                style={{
                  clipPath: `polygon(
                    0% 0%,
                    0% 100%,
                    ${targetRect.left - 8}px 100%,
                    ${targetRect.left - 8}px ${targetRect.top - 8}px,
                    ${targetRect.left + targetRect.width + 8}px ${targetRect.top - 8}px,
                    ${targetRect.left + targetRect.width + 8}px ${targetRect.top + targetRect.height + 8}px,
                    ${targetRect.left - 8}px ${targetRect.top + targetRect.height + 8}px,
                    ${targetRect.left - 8}px 100%,
                    100% 100%,
                    100% 0%
                  )`,
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute pointer-events-none rounded-xl"
                style={{
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                  boxShadow:
                    "0 0 0 4px rgba(249, 115, 22, 0.5), 0 0 20px 8px rgba(249, 115, 22, 0.3)",
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleSkip}
            />
          )}

          <div
            className={
              hasTarget
                ? ""
                : "fixed inset-0 flex items-center justify-center pointer-events-none p-4"
            }
          >
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl pointer-events-auto"
              style={
                hasTarget
                  ? getTooltipStyle()
                  : { width: tooltipWidth, maxWidth: "100%" }
              }
            >
              {getArrowStyle() && (
                <div style={{ ...getArrowStyle()!, zIndex: 10 }} />
              )}

              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange-500 to-amber-400" />

                <button
                  onClick={handleSkip}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="relative flex-shrink-0"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 p-0.5 shadow-lg shadow-orange-500/30">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                          <Image
                            src={MAX_AVATAR_URL}
                            alt="Max"
                            width={48}
                            height={48}
                            className="rounded-xl w-10 h-10 sm:w-12 sm:h-12"
                            unoptimized
                          />
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white shadow-md">
                        {step.icon}
                      </div>
                    </motion.div>

                    <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                      <motion.h2
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-base sm:text-lg font-bold text-zinc-900 mb-1 sm:mb-1.5"
                      >
                        {step.title}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs sm:text-sm text-zinc-600 leading-relaxed"
                      >
                        {step.description}
                      </motion.p>
                    </div>
                  </div>

                  {step.tip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-orange-200/50"
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-900 pt-0.5 sm:pt-1 leading-relaxed">
                        {step.tip}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                    {filteredSteps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? "w-6 sm:w-8 bg-gradient-to-r from-primary to-orange-500"
                            : index < currentStep
                              ? "w-1.5 sm:w-2 bg-orange-300"
                              : "w-1.5 sm:w-2 bg-zinc-200"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                      className="text-zinc-500 hover:text-zinc-700 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      Passer
                    </Button>

                    <Button
                      onClick={handleNext}
                      size="sm"
                      className="bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-primary text-white px-3 sm:px-5 shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 text-xs sm:text-sm"
                    >
                      {isLastStep ? (
                        <>
                          C&apos;est parti !
                          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                        </>
                      ) : (
                        <>
                          Suivant
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
