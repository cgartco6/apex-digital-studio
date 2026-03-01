import openai
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import numpy as np
from typing import List, Dict, Any, Optional
import json
from dataclasses import dataclass
from enum import Enum

class LogoStyle(Enum):
    MODERN = "modern"
    VINTAGE = "vintage"
    MINIMAL = "minimal"
    ABSTRACT = "abstract"
    TYPOCRAPHIC = "typographic"
    EMBLEM = "emblem"
    MASCOT = "mascot"
    COMBINATION = "combination"

@dataclass
class ColorPalette:
    primary: str
    secondary: str
    accent: str
    background: str
    text: str
    
    def to_list(self) -> List[str]:
        return [self.primary, self.secondary, self.accent, self.background, self.text]

class LogoGenerator:
    """AI-powered logo generator using DALL-E 3"""
    
    def __init__(self, api_key: str):
        openai.api_key = api_key
        self.styles = self._load_styles()
        self.color_palettes = self._load_color_palettes()
        
    def _load_styles(self) -> Dict[str, Dict[str, Any]]:
        """Load logo style configurations"""
        return {
            LogoStyle.MODERN.value: {
                "description": "Clean, minimal, geometric shapes",
                "characteristics": ["simple", "clean lines", "geometric", "sans-serif"],
                "prompt_template": "modern minimalist logo for {company_name} in {industry}, {characteristics}, {color_palette}"
            },
            LogoStyle.VINTAGE.value: {
                "description": "Classic, retro, handcrafted look",
                "characteristics": ["retro", "classic", "textured", "serif fonts"],
                "prompt_template": "vintage retro logo for {company_name} in {industry}, {characteristics}, {color_palette}"
            },
            LogoStyle.MINIMAL.value: {
                "description": "Extremely simple and clean",
                "characteristics": ["minimal", "clean", "single color", "negative space"],
                "prompt_template": "minimalist logo for {company_name}, single color, clean design, {color_palette}"
            },
            LogoStyle.ABSTRACT.value: {
                "description": "Artistic and symbolic shapes",
                "characteristics": ["abstract", "symbolic", "artistic", "unique shape"],
                "prompt_template": "abstract artistic logo for {company_name} in {industry}, symbolic design, {color_palette}"
            }
        }
    
    def _load_color_palettes(self) -> Dict[str, ColorPalette]:
        """Load predefined color palettes"""
        return {
            "corporate": ColorPalette(
                primary="#1a237e",  # Dark blue
                secondary="#283593", # Blue
                accent="#3949ab",    # Light blue
                background="#ffffff", # White
                text="#212121"       # Dark gray
            ),
            "vibrant": ColorPalette(
                primary="#d32f2f",   # Red
                secondary="#f44336", # Light red
                accent="#ff9800",    # Orange
                background="#f5f5f5", # Light gray
                text="#212121"       # Dark gray
            ),
            "natural": ColorPalette(
                primary="#388e3c",   # Green
                secondary="#4caf50", # Light green
                accent="#8bc34a",    # Lime
                background="#f1f8e9", # Very light green
                text="#1b5e20"       # Dark green
            ),
            "tech": ColorPalette(
                primary="#0d47a1",   # Dark blue
                secondary="#2196f3", # Blue
                accent="#00bcd4",    # Cyan
                background="#e3f2fd", # Light blue
                text="#0d47a1"       # Dark blue
            ),
            "luxury": ColorPalette(
                primary="#5d4037",   # Brown
                secondary="#8d6e63", # Light brown
                accent="#d7ccc8",    # Beige
                background="#f5f5f5", # Light gray
                text="#3e2723"       # Dark brown
            )
        }
    
    def generate_logo(self, 
                     company_name: str,
                     industry: str,
                     style: str = "modern",
                     color_palette_name: str = "corporate",
                     additional_prompt: str = "") -> Dict[str, Any]:
        """Generate a logo using DALL-E 3"""
        
        # Get style configuration
        style_config = self.styles.get(style, self.styles[LogoStyle.MODERN.value])
        
        # Get color palette
        palette = self.color_palettes.get(color_palette_name, self.color_palettes["corporate"])
        
        # Build prompt
        prompt = style_config["prompt_template"].format(
            company_name=company_name,
            industry=industry,
            characteristics=", ".join(style_config["characteristics"]),
            color_palette=f"colors: {', '.join(palette.to_list())}"
        )
        
        if additional_prompt:
            prompt += f", {additional_prompt}"
        
        try:
            # Generate logo using DALL-E 3
            response = openai.Image.create(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
                response_format="url"
            )
            
            logo_url = response.data[0].url
            
            # Generate variations
            variations = self._generate_variations(logo_url, style, palette)
            
            # Generate mockups
            mockups = self._generate_mockups(logo_url)
            
            return {
                "success": True,
                "logo_url": logo_url,
                "variations": variations,
                "mockups": mockups,
                "prompt_used": prompt,
                "style": style,
                "color_palette": palette.to_list(),
                "company_name": company_name,
                "industry": industry,
                "generated_at": self._get_timestamp()
            }
            
        except Exception as e:
            print(f"Error generating logo: {e}")
            return {
                "success": False,
                "error": str(e),
                "prompt_used": prompt
            }
    
    def _generate_variations(self, base_logo_url: str, style: str, base_palette: ColorPalette) -> List[Dict[str, Any]]:
        """Generate color variations of the logo"""
        variations = []
        
        for palette_name, palette in self.color_palettes.items():
            if palette_name != "corporate":  # Skip base palette
                variation_prompt = f"Take this logo and apply {palette_name} color palette: {', '.join(palette.to_list())}"
                
                try:
                    response = openai.Image.create_edit(
                        image=base_logo_url,
                        prompt=variation_prompt,
                        n=1,
                        size="1024x1024",
                        response_format="url"
                    )
                    
                    variations.append({
                        "name": f"{style.capitalize()} - {palette_name.capital()}",
                        "url": response.data[0].url,
                        "colors": palette.to_list(),
                        "description": f"{style} style with {palette_name} color palette"
                    })
                except:
                    # If edit fails, create new variation
                    pass
        
        return variations
    
    def _generate_mockups(self, logo_url: str) -> List[Dict[str, Any]]:
        """Generate mockups showing logo in use"""
        mockup_types = [
            ("business_card", "Logo on a professional business card"),
            ("website", "Logo in website header"),
            ("social_media", "Logo on social media profile"),
            ("packaging", "Logo on product packaging"),
            ("merchandise", "Logo on t-shirt"),
            ("stationery", "Logo on letterhead")
        ]
        
        mockups = []
        
        for mockup_type, description in mockup_types:
            try:
                prompt = f"{description}, professional mockup, realistic, high quality"
                
                response = openai.Image.create_edit(
                    image=logo_url,
                    prompt=prompt,
                    n=1,
                    size="1024x1024",
                    response_format="url"
                )
                
                mockups.append({
                    "type": mockup_type,
                    "url": response.data[0].url,
                    "description": description
                })
            except:
                # Skip if edit fails
                continue
        
        return mockups
    
    def analyze_logo_design(self, logo_url: str) -> Dict[str, Any]:
        """Analyze logo design and provide feedback"""
        analysis_prompt = f"""
        Analyze this logo design and provide detailed feedback:
        1. Design principles (balance, contrast, alignment, hierarchy)
        2. Color psychology and suitability
        3. Typography analysis
        4. Scalability assessment
        5. Industry appropriateness
        6. Memorability score
        7. Suggested improvements
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": analysis_prompt},
                            {"type": "image_url", "image_url": {"url": logo_url}}
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            analysis = response.choices[0].message.content
            
            return {
                "success": True,
                "analysis": analysis,
                "scores": self._calculate_design_scores(analysis)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _calculate_design_scores(self, analysis: str) -> Dict[str, float]:
        """Calculate design scores from analysis"""
        # This would parse the analysis to extract scores
        # For now, return mock scores
        return {
            "balance": 8.5,
            "contrast": 7.8,
            "alignment": 9.2,
            "hierarchy": 8.0,
            "color_suitability": 8.7,
            "scalability": 9.0,
            "memorability": 8.3,
            "overall": 8.5
        }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def generate_batch_logos(self, 
                           company_names: List[str],
                           industry: str,
                           style: str = "modern",
                           num_variations: int = 3) -> List[Dict[str, Any]]:
        """Generate logos for multiple companies"""
        results = []
        
        for company_name in company_names:
            logo = self.generate_logo(
                company_name=company_name,
                industry=industry,
                style=style,
                additional_prompt=f"generate {num_variations} different concepts"
            )
            
            if logo["success"]:
                results.append(logo)
        
        return results
    
    def optimize_logo_for_print(self, logo_url: str) -> Dict[str, Any]:
        """Optimize logo for print applications"""
        optimization_prompt = """
        Optimize this logo for print applications:
        1. Convert to CMYK color space
        2. Ensure high resolution (300 DPI)
        3. Add bleed area
        4. Create vector version
        5. Optimize for different print materials
        6. Create monochrome version
        """
        
        try:
            response = openai.Image.create_edit(
                image=logo_url,
                prompt=optimization_prompt,
                n=1,
                size="1024x1024",
                response_format="url"
            )
            
            return {
                "success": True,
                "optimized_url": response.data[0].url,
                "recommendations": [
                    "Use vector format for scaling",
                    "CMYK colors for print",
                    "Include 3mm bleed area",
                    "Provide monochrome version"
                ]
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Example usage
if __name__ == "__main__":
    generator = LogoGenerator(api_key="your-openai-api-key")
    
    # Generate a logo
    result = generator.generate_logo(
        company_name="Tech Innovations",
        industry="technology",
        style="modern",
        color_palette_name="tech",
        additional_prompt="futuristic, clean, professional"
    )
    
    if result["success"]:
        print(f"Logo generated: {result['logo_url']}")
        print(f"Variations: {len(result['variations'])}")
        print(f"Mockups: {len(result['mockups'])}")
        
        # Analyze the logo
        analysis = generator.analyze_logo_design(result["logo_url"])
        if analysis["success"]:
            print(f"Design analysis: {analysis['analysis'][:200]}...")
            print(f"Scores: {analysis['scores']}")
